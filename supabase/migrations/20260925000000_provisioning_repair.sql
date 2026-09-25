-- Provisioning repair.
--
-- The handle_new_user() function existed but no trigger on auth.users ever
-- invoked it, so Edge-Function-created auth users got no profile row and
-- admin_provision_profile (UPDATE-only) raised PROFILE_NOT_FOUND every
-- time — every admin provisioning attempt rolled back. This migration:
--   1. restores the missing AFTER INSERT trigger, and
--   2. makes admin_provision_profile trigger-independent via upsert, so a
--      missing/slow trigger can never break provisioning again.

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.admin_provision_profile(
  p_user_id uuid,
  p_display_name text,
  p_username text,
  p_role app_role,
  p_phone text default null,
  p_grade_level text default null,
  p_subject text default null
)
returns profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  result public.profiles;
  clean_username text := lower(trim(coalesce(p_username,'')));
begin
  if caller is null or not public.is_admin() then
    raise exception 'NOT_AUTHORIZED' using errcode = '42501';
  end if;

  if p_user_id is null then raise exception 'USER_ID_REQUIRED'; end if;
  if p_role not in ('student','teacher') then raise exception 'ROLE_NOT_ALLOWED'; end if;
  if trim(coalesce(p_display_name,'')) = '' then raise exception 'DISPLAY_NAME_REQUIRED'; end if;
  if clean_username !~ '^[a-z0-9](?:[a-z0-9._-]{2,29})$' then raise exception 'USERNAME_INVALID'; end if;
  if exists (select 1 from public.profiles where lower(username)=clean_username and id<>p_user_id) then
    raise exception 'USERNAME_TAKEN'; end if;

  -- Upsert (not bare UPDATE): works whether or not the signup trigger has
  -- already created the row. The trigger remains as the normal path.
  insert into public.profiles as p (id, display_name, username, role, status, phone, grade_level, subject, updated_at)
  values (
    p_user_id,
    left(trim(p_display_name),120),
    clean_username,
    p_role,
    'active',
    nullif(left(trim(coalesce(p_phone,'')),32),''),
    case when p_role='student' then nullif(left(trim(coalesce(p_grade_level,'')),40),'') else null end,
    case when p_role='teacher' then nullif(left(trim(coalesce(p_subject,'')),120),'') else null end,
    now()
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    username = excluded.username,
    role = excluded.role,
    status = 'active',
    phone = excluded.phone,
    grade_level = excluded.grade_level,
    subject = excluded.subject,
    updated_at = now()
  returning * into result;

  insert into public.audit_events(actor_user_id, action, resource_type, resource_id, metadata_json)
  values (
    caller,
    'admin.provision_user_profile',
    'profile',
    p_user_id,
    jsonb_build_object('username', result.username, 'role', result.role::text)
  );

  return result;
end;
$$;

revoke execute on function public.admin_provision_profile(uuid, text, text, app_role, text, text, text) from public, anon;
grant execute on function public.admin_provision_profile(uuid, text, text, app_role, text, text, text) to authenticated;
