-- Admin control plane for Saarthians.
--
-- Backward-compatible: only adds functions and one missing column. No existing
-- policy, table, or function signature is altered. Complements the Edge
-- Function provision-user flow (auth account creation + admin_provision_profile):
-- account provisioning stays in that single audited path, while this file adds
-- the read/update/relationship/audit surface the admin console needs.
--
-- Every function below:
--   * is SECURITY DEFINER with fixed search_path,
--   * rejects non-admin callers first (public.is_admin()),
--   * validates all inputs server-side,
--   * writes an audit_events row itself (browsers can never forge audit rows),
--   * is revoked from anon/public and granted only to authenticated.
--
-- NOTE: test_answers.updated_at is referenced by save_test_answer but was never
-- added to the schema, so answer saves fail on a fresh database. Added here
-- with IF NOT EXISTS; safe to re-run.

alter table public.test_answers
  add column if not exists updated_at timestamptz not null default now();

-- Overview counts for /admin. Single round trip, real data only.
create or replace function public.admin_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'students_total',     (select count(*) from public.profiles where role = 'student'),
    'students_active',    (select count(*) from public.profiles where role = 'student' and status = 'active'),
    'students_pending',   (select count(*) from public.profiles where role = 'student' and status = 'pending'),
    'students_suspended', (select count(*) from public.profiles where role = 'student' and status = 'suspended'),
    'teachers_total',     (select count(*) from public.profiles where role = 'teacher'),
    'teachers_active',    (select count(*) from public.profiles where role = 'teacher' and status = 'active'),
    'tests_total',        (select count(*) from public.tests),
    'tests_draft',        (select count(*) from public.tests where status = 'draft'),
    'tests_published',    (select count(*) from public.tests where status = 'published'),
    'attempts_total',     (select count(*) from public.test_attempts),
    'attempts_graded',    (select count(*) from public.test_attempts where status in ('graded', 'reviewed')),
    'attempts_last_7d',   (select count(*) from public.test_attempts where created_at >= now() - interval '7 days'),
    'users_last_7d',      (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
    'generated_at',       now()
  ) into v_result;

  return v_result;
end;
$$;

-- Paginated profile list for /admin/users with role/status/search filters.
create or replace function public.admin_list_profiles(
  p_role text default null,
  p_status text default null,
  p_search text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table(
  id uuid,
  display_name text,
  username text,
  role public.app_role,
  status public.user_status,
  phone text,
  grade_level text,
  subject text,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 25), 1), 100);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
begin
  if not public.is_admin() then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
  end if;
  if p_role is not null and p_role not in ('student', 'teacher', 'admin') then
    raise exception 'INVALID_ROLE' using errcode = '22023';
  end if;
  if p_status is not null and p_status not in ('active', 'suspended', 'pending') then
    raise exception 'INVALID_STATUS' using errcode = '22023';
  end if;

  return query
  select
    p.id, p.display_name, p.username, p.role, p.status,
    p.phone, p.grade_level, p.subject, p.created_at, p.updated_at,
    count(*) over () as total_count
  from public.profiles p
  where (p_role is null or p.role = p_role::public.app_role)
    and (p_status is null or p.status = p_status::public.user_status)
    and (
      p_search is null
      or btrim(p_search) = ''
      or strpos(lower(coalesce(p.display_name, '')), lower(btrim(p_search))) > 0
      or strpos(lower(coalesce(p.username, '')), lower(btrim(p_search))) > 0
    )
  order by p.created_at desc
  limit v_limit offset v_offset;
end;
$$;

-- Change a user's status. Suspended users are rejected by getAuthenticatedUser
-- and every RPC role check, so this is enforced server-side, not UI-only.
-- Admins cannot change their own status (prevents accidental lockout).
create or replace function public.admin_set_profile_status(
  p_user_id uuid,
  p_status public.user_status
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if not public.is_admin() then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
  end if;
  if p_user_id is null then
    raise exception 'INVALID_USER' using errcode = '22023';
  end if;
  if p_user_id = v_actor then
    raise exception 'CANNOT_CHANGE_OWN_STATUS' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'USER_NOT_FOUND' using errcode = '22023';
  end if;

  update public.profiles
  set status = p_status, updated_at = now()
  where id = p_user_id;

  insert into public.audit_events (actor_user_id, action, resource_type, resource_id, metadata_json)
  values (v_actor, 'admin.set_profile_status', 'profiles', p_user_id,
          jsonb_build_object('status', p_status::text));

  return true;
end;
$$;

-- Edit allowed profile fields. Role, status, and username are deliberately NOT
-- editable here: role/status/username changes go through the protected paths
-- (provisioning RPC + status RPC), guarded by
-- protect_profile_authorization_fields, so there is exactly one privilege path
-- to review. grade_level applies to students, subject to teachers.
create or replace function public.admin_update_profile(
  p_user_id uuid,
  p_display_name text,
  p_phone text default null,
  p_grade_level text default null,
  p_subject text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_name text := left(btrim(coalesce(p_display_name, '')), 120);
  v_phone text := nullif(left(btrim(coalesce(p_phone, '')), 32), '');
  v_grade text;
  v_subject text;
  v_role public.app_role;
begin
  if not public.is_admin() then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
  end if;
  if p_user_id is null then
    raise exception 'INVALID_USER' using errcode = '22023';
  end if;
  if char_length(v_name) < 1 then
    raise exception 'INVALID_DISPLAY_NAME' using errcode = '22023';
  end if;
  if v_phone is not null and char_length(v_phone) < 7 then
    raise exception 'INVALID_PHONE' using errcode = '22023';
  end if;

  select role into v_role from public.profiles where id = p_user_id;
  if not found then
    raise exception 'USER_NOT_FOUND' using errcode = '22023';
  end if;

  v_grade := case
    when v_role = 'student' then nullif(left(btrim(coalesce(p_grade_level, '')), 40), '')
    else null
  end;
  v_subject := case
    when v_role = 'teacher' then nullif(left(btrim(coalesce(p_subject, '')), 120), '')
    else null
  end;

  update public.profiles
  set display_name = v_name,
      phone = v_phone,
      grade_level = v_grade,
      subject = v_subject,
      updated_at = now()
  where id = p_user_id;

  insert into public.audit_events (actor_user_id, action, resource_type, resource_id, metadata_json)
  values (v_actor, 'admin.update_profile', 'profiles', p_user_id,
          jsonb_build_object('display_name', v_name));

  return true;
end;
$$;

-- Assign a student to a teacher. Both sides are validated server-side.
create or replace function public.admin_assign_teacher_student(
  p_teacher_id uuid,
  p_student_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if not public.is_admin() then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
  end if;
  if p_teacher_id is null or p_student_id is null or p_teacher_id = p_student_id then
    raise exception 'INVALID_RELATIONSHIP' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = p_teacher_id and role = 'teacher' and status = 'active') then
    raise exception 'TEACHER_NOT_FOUND' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = p_student_id and role = 'student') then
    raise exception 'STUDENT_NOT_FOUND' using errcode = '22023';
  end if;

  insert into public.teacher_student (teacher_id, student_id, status)
  values (p_teacher_id, p_student_id, 'active')
  on conflict (teacher_id, student_id)
  do update set status = 'active';

  insert into public.audit_events (actor_user_id, action, resource_type, resource_id, metadata_json)
  values (v_actor, 'admin.assign_teacher_student', 'teacher_student', p_student_id,
          jsonb_build_object('teacher_id', p_teacher_id::text, 'student_id', p_student_id::text));

  return true;
end;
$$;

-- Remove a teacher/student relationship (hard delete; the audit row preserves history).
create or replace function public.admin_unassign_teacher_student(
  p_teacher_id uuid,
  p_student_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if not public.is_admin() then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
  end if;
  if p_teacher_id is null or p_student_id is null then
    raise exception 'INVALID_RELATIONSHIP' using errcode = '22023';
  end if;

  delete from public.teacher_student
  where teacher_id = p_teacher_id and student_id = p_student_id;

  if not found then
    raise exception 'RELATIONSHIP_NOT_FOUND' using errcode = '22023';
  end if;

  insert into public.audit_events (actor_user_id, action, resource_type, resource_id, metadata_json)
  values (v_actor, 'admin.unassign_teacher_student', 'teacher_student', p_student_id,
          jsonb_build_object('teacher_id', p_teacher_id::text, 'student_id', p_student_id::text));

  return true;
end;
$$;

-- Paginated relationship list with display names for /admin/relationships.
create or replace function public.admin_list_relationships(
  p_search text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table(
  teacher_id uuid,
  teacher_name text,
  student_id uuid,
  student_name text,
  student_status public.user_status,
  status text,
  created_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 25), 1), 100);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
begin
  if not public.is_admin() then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
  end if;

  return query
  select
    ts.teacher_id, coalesce(t.display_name, ''), ts.student_id,
    coalesce(s.display_name, ''), s.status, ts.status, ts.created_at,
    count(*) over () as total_count
  from public.teacher_student ts
  join public.profiles t on t.id = ts.teacher_id
  join public.profiles s on s.id = ts.student_id
  where (
    p_search is null
    or btrim(p_search) = ''
    or strpos(lower(coalesce(t.display_name, '')), lower(btrim(p_search))) > 0
    or strpos(lower(coalesce(s.display_name, '')), lower(btrim(p_search))) > 0
    or strpos(lower(coalesce(t.username, '')), lower(btrim(p_search))) > 0
    or strpos(lower(coalesce(s.username, '')), lower(btrim(p_search))) > 0
  )
  order by ts.created_at desc
  limit v_limit offset v_offset;
end;
$$;

-- Administrative visibility into assessments (read-only; teacher workflows untouched).
create or replace function public.admin_list_tests(
  p_status text default null,
  p_search text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table(
  id uuid,
  title text,
  status public.content_status,
  teacher_id uuid,
  teacher_name text,
  question_count bigint,
  attempt_count bigint,
  created_at timestamptz,
  published_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 25), 1), 100);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
begin
  if not public.is_admin() then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
  end if;
  if p_status is not null and p_status not in ('draft', 'published', 'archived') then
    raise exception 'INVALID_STATUS' using errcode = '22023';
  end if;

  return query
  select
    t.id, t.title, t.status, t.teacher_id, coalesce(p.display_name, ''),
    (select count(*) from public.test_questions q where q.test_id = t.id),
    (select count(*) from public.test_attempts a where a.test_id = t.id),
    t.created_at, t.published_at,
    count(*) over () as total_count
  from public.tests t
  left join public.profiles p on p.id = t.teacher_id
  where (p_status is null or t.status = p_status::public.content_status)
    and (
      p_search is null
      or btrim(p_search) = ''
      or strpos(lower(t.title), lower(btrim(p_search))) > 0
    )
  order by t.created_at desc
  limit v_limit offset v_offset;
end;
$$;

-- Real audit trail for /admin/audit. Metadata is returned as-is; the UI must
-- never render secrets (these functions never store secrets in metadata).
create or replace function public.admin_list_audit(
  p_action text default null,
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table(
  id uuid,
  created_at timestamptz,
  actor_user_id uuid,
  actor_name text,
  action text,
  resource_type text,
  resource_id uuid,
  metadata_json jsonb,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
begin
  if not public.is_admin() then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
  end if;

  return query
  select
    e.id, e.created_at, e.actor_user_id, coalesce(p.display_name, ''),
    e.action, e.resource_type, e.resource_id, e.metadata_json,
    count(*) over () as total_count
  from public.audit_events e
  left join public.profiles p on p.id = e.actor_user_id
  where (p_action is null or btrim(p_action) = '' or e.action = btrim(p_action))
    and (
      p_search is null
      or btrim(p_search) = ''
      or strpos(lower(e.action), lower(btrim(p_search))) > 0
      or strpos(lower(e.resource_type), lower(btrim(p_search))) > 0
    )
  order by e.created_at desc
  limit v_limit offset v_offset;
end;
$$;

-- Safe connectivity probe for /admin/system. Returns server time only.
create or replace function public.admin_db_check()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
  end if;
  return now();
end;
$$;

revoke execute on function public.admin_overview() from public, anon;
revoke execute on function public.admin_list_profiles(text, text, text, integer, integer) from public, anon;
revoke execute on function public.admin_set_profile_status(uuid, public.user_status) from public, anon;
revoke execute on function public.admin_update_profile(uuid, text, text, text, text) from public, anon;
revoke execute on function public.admin_assign_teacher_student(uuid, uuid) from public, anon;
revoke execute on function public.admin_unassign_teacher_student(uuid, uuid) from public, anon;
revoke execute on function public.admin_list_relationships(text, integer, integer) from public, anon;
revoke execute on function public.admin_list_tests(text, text, integer, integer) from public, anon;
revoke execute on function public.admin_list_audit(text, text, integer, integer) from public, anon;
revoke execute on function public.admin_db_check() from public, anon;

grant execute on function public.admin_overview() to authenticated;
grant execute on function public.admin_list_profiles(text, text, text, integer, integer) to authenticated;
grant execute on function public.admin_set_profile_status(uuid, public.user_status) to authenticated;
grant execute on function public.admin_update_profile(uuid, text, text, text, text) to authenticated;
grant execute on function public.admin_assign_teacher_student(uuid, uuid) to authenticated;
grant execute on function public.admin_unassign_teacher_student(uuid, uuid) to authenticated;
grant execute on function public.admin_list_relationships(text, integer, integer) to authenticated;
grant execute on function public.admin_list_tests(text, text, integer, integer) to authenticated;
grant execute on function public.admin_list_audit(text, text, integer, integer) to authenticated;
grant execute on function public.admin_db_check() to authenticated;
