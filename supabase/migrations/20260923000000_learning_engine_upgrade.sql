-- Learning engine upgrade: study materials + RAG + scheduled live tests.
--
-- SECTION A: pgvector for material embeddings.
-- SECTION B: tests scheduling (start_time / end_time) + assessment PDF path.
-- SECTION C: attempts deadline_at + submission_reason (display states
--            active/submitted/auto_submitted/expired are derived in
--            resolveAttemptState(); the attempt_status enum is untouched
--            because ALTER TYPE ... ADD VALUE cannot run in a migration
--            transaction).
-- SECTION D: test_security_events (visibility/focus/fullscreen/heartbeat).
-- SECTION E: study_materials + chunks + embeddings with RLS.
-- SECTION F: match_material_chunks() retrieval RPC (auth enforced in SQL).
-- SECTION G: schedule-aware start/save/submit + finalize_expired_attempts().
-- SECTION H: private storage buckets (study-materials, assessments) + policies.

-- A ---------------------------------------------------------------------
create extension if not exists vector;

-- B ---------------------------------------------------------------------
alter table public.tests
  add column if not exists start_time timestamptz null,
  add column if not exists end_time timestamptz null,
  add column if not exists assessment_pdf_path text null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tests_window_check'
  ) then
    alter table public.tests
      add constraint tests_window_check
      check (end_time is null or start_time is null or end_time > start_time);
  end if;
end $$;

-- C ---------------------------------------------------------------------
alter table public.test_attempts
  add column if not exists deadline_at timestamptz null,
  add column if not exists submission_reason text null
    check (submission_reason is null or submission_reason in
      ('manual', 'auto_deadline', 'auto_leave', 'expired_sweep'));

-- D ---------------------------------------------------------------------
create table if not exists public.test_security_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.test_attempts (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null check (event_type in
    ('visibility_hidden', 'visibility_visible', 'focus_blur', 'focus_focus',
     'fullscreen_exit', 'fullscreen_enter', 'heartbeat', 'leave_finalize',
     'signout_finalize', 'deadline_finalize')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists test_security_events_by_attempt
  on public.test_security_events (attempt_id, created_at desc);

alter table public.test_security_events enable row level security;

drop policy if exists test_security_events_owner on public.test_security_events;
create policy test_security_events_owner on public.test_security_events
for select
using (student_id = auth.uid() or public.is_admin());

drop policy if exists test_security_events_teacher on public.test_security_events;
create policy test_security_events_teacher on public.test_security_events
for select
using (
  exists (
    select 1
    from public.test_attempts at
    join public.tests t on t.id = at.test_id
    join public.teacher_student ts
      on ts.teacher_id = t.teacher_id
     and ts.student_id = at.student_id
     and ts.status = 'active'
    where at.id = test_security_events.attempt_id
      and ts.teacher_id = auth.uid()
  )
  or public.is_admin()
);

-- E ---------------------------------------------------------------------
create table if not exists public.study_materials (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  subject text not null default '',
  grade_level text not null default '',
  chapter text not null default '',
  original_filename text not null default '',
  storage_path text not null default '',
  mime_type text not null default 'application/pdf',
  original_size_bytes integer not null default 0,
  stored_size_bytes integer not null default 0,
  compression_ratio numeric not null default 0,
  optimization_status text not null default 'pending'
    check (optimization_status in ('pending', 'compressed', 'stored_original', 'skipped')),
  page_count integer not null default 0,
  processing_status text not null default 'uploading'
    check (processing_status in ('uploading', 'processing', 'ready', 'failed')),
  processing_error text null,
  extraction_status text not null default 'pending'
    check (extraction_status in ('pending', 'complete', 'no_text', 'failed')),
  embedding_status text not null default 'pending'
    check (embedding_status in ('pending', 'complete', 'failed', 'skipped')),
  embedding_model text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists study_materials_by_teacher
  on public.study_materials (teacher_id, created_at desc);

create table if not exists public.study_material_chunks (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.study_materials (id) on delete cascade,
  page_number integer not null default 1,
  chunk_index integer not null default 0,
  text text not null default '',
  metadata_json jsonb not null default '{}'::jsonb
);
create index if not exists study_material_chunks_by_material
  on public.study_material_chunks (material_id, chunk_index);

create table if not exists public.study_material_embeddings (
  chunk_id uuid primary key references public.study_material_chunks (id) on delete cascade,
  embedding public.vector(768) not null,
  model text not null default ''
);
create index if not exists study_material_embeddings_hnsw
  on public.study_material_embeddings
  using hnsw (embedding vector_cosine_ops);

alter table public.study_materials enable row level security;
alter table public.study_material_chunks enable row level security;
alter table public.study_material_embeddings enable row level security;

-- Helper: is this material visible to the caller?
-- (owner teacher, actively-assigned student of the owner, or admin)
drop policy if exists study_materials_access on public.study_materials;
create policy study_materials_access on public.study_materials
for all
using (
  teacher_id = auth.uid()
  or public.is_admin()
  or (
    processing_status = 'ready'
    and exists (
      select 1 from public.teacher_student ts
      where ts.teacher_id = study_materials.teacher_id
        and ts.student_id = auth.uid()
        and ts.status = 'active'
    )
  )
)
with check (teacher_id = auth.uid() or public.is_admin());

drop policy if exists study_material_chunks_access on public.study_material_chunks;
create policy study_material_chunks_access on public.study_material_chunks
for all
using (
  exists (
    select 1 from public.study_materials m
    where m.id = study_material_chunks.material_id
      and (
        m.teacher_id = auth.uid()
        or public.is_admin()
        or (
          m.processing_status = 'ready'
          and exists (
            select 1 from public.teacher_student ts
            where ts.teacher_id = m.teacher_id
              and ts.student_id = auth.uid()
              and ts.status = 'active'
          )
        )
      )
  )
)
with check (
  exists (
    select 1 from public.study_materials m
    where m.id = study_material_chunks.material_id
      and (m.teacher_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists study_material_embeddings_access on public.study_material_embeddings;
create policy study_material_embeddings_access on public.study_material_embeddings
for all
using (
  exists (
    select 1 from public.study_material_chunks c
    join public.study_materials m on m.id = c.material_id
    where c.id = study_material_embeddings.chunk_id
      and (
        m.teacher_id = auth.uid()
        or public.is_admin()
        or (
          m.processing_status = 'ready'
          and exists (
            select 1 from public.teacher_student ts
            where ts.teacher_id = m.teacher_id
              and ts.student_id = auth.uid()
              and ts.status = 'active'
          )
        )
      )
  )
)
with check (
  exists (
    select 1 from public.study_material_chunks c
    join public.study_materials m on m.id = c.material_id
    where c.id = study_material_embeddings.chunk_id
      and (m.teacher_id = auth.uid() or public.is_admin())
  )
);

-- F ---------------------------------------------------------------------
-- Authorized semantic retrieval. Authorization happens INSIDE this function:
-- only chunks of materials the caller may see are ever ranked.
drop function if exists public.match_material_chunks(public.vector(768), uuid, integer, double precision);

create or replace function public.match_material_chunks(
  p_query public.vector(768),
  p_material_id uuid default null,
  p_limit integer default 8,
  p_threshold double precision default 0.45
)
returns table (
  chunk_id uuid,
  material_id uuid,
  material_title text,
  page_number integer,
  chunk_text text,
  distance double precision
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_role text;
begin
  if v_user is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 20 then
    raise exception 'INVALID_LIMIT' using errcode = '22023';
  end if;

  select role::text into v_role from public.profiles where id = v_user;
  if v_role is null then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
  end if;

  return query
  select
    c.id, m.id, m.title, c.page_number, c.text,
    (e.embedding <=> p_query)::double precision as distance
  from public.study_material_embeddings e
  join public.study_material_chunks c on c.id = e.chunk_id
  join public.study_materials m on m.id = c.material_id
  where m.processing_status = 'ready'
    and (p_material_id is null or m.id = p_material_id)
    and (
      m.teacher_id = v_user
      or public.is_admin()
      or (
        v_role = 'student'
        and exists (
          select 1 from public.teacher_student ts
          where ts.teacher_id = m.teacher_id
            and ts.student_id = v_user
            and ts.status = 'active'
        )
      )
    )
    and (e.embedding <=> p_query) <= p_threshold
  order by e.embedding <=> p_query
  limit p_limit;
end;
$$;

revoke execute on function public.match_material_chunks(public.vector(768), uuid, integer, double precision) from public, anon;
grant execute on function public.match_material_chunks(public.vector(768), uuid, integer, double precision) to authenticated;

-- G ---------------------------------------------------------------------
-- Finalize the caller's expired in-progress attempts. Returns the count
-- finalized. This is the server-side backstop behind every client
-- auto-submit: browsers signal, the database decides.
drop function if exists public.finalize_expired_attempts();

create or replace function public.finalize_expired_attempts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_count integer := 0;
  r record;
  v_score numeric(10,2);
  v_max numeric(10,2);
  v_deadline timestamptz;
begin
  if v_user is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  for r in
    select at.id, at.started_at, at.deadline_at, at.test_id,
           t.duration_seconds, t.end_time
    from public.test_attempts at
    join public.tests t on t.id = at.test_id
    where at.student_id = v_user
      and at.status = 'in_progress'
    for update of at
  loop
    v_deadline := r.deadline_at;
    if v_deadline is null and r.duration_seconds is not null and r.duration_seconds > 0 and r.started_at is not null then
      v_deadline := r.started_at + make_interval(secs => r.duration_seconds);
    end if;
    if v_deadline is not null and r.end_time is not null and r.end_time < v_deadline then
      v_deadline := r.end_time;
    end if;
    if v_deadline is null and r.end_time is not null then
      v_deadline := r.end_time;
    end if;

    if v_deadline is not null and now() >= v_deadline then
      select coalesce(sum(q.points),0),
             coalesce(sum(case when a.answer_json = q.correct_answer_json then q.points else 0 end),0)
        into v_max, v_score
      from public.test_questions q
      left join public.test_answers a on a.attempt_id = r.id and a.question_id = q.id
      where q.test_id = r.test_id;

      update public.test_answers a
      set awarded_points = case when a.answer_json = q.correct_answer_json then q.points else 0 end,
          feedback = case when a.answer_json = q.correct_answer_json then 'Correct.' else 'Review this question and try the concept again.' end
      from public.test_questions q
      where a.attempt_id = r.id and a.question_id = q.id;

      update public.test_attempts
      set status = 'submitted',
          submission_reason = 'expired_sweep',
          score = v_score,
          max_score = v_max,
          submitted_at = v_deadline,
          deadline_at = coalesce(deadline_at, v_deadline)
      where id = r.id;

      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

revoke execute on function public.finalize_expired_attempts() from public, anon;
grant execute on function public.finalize_expired_attempts() to authenticated;

-- Schedule-aware start (same signature: body replaced).
create or replace function public.start_test_attempt(p_test_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_attempt uuid;
  v_test_id uuid;
  v_started_at timestamptz;
  v_duration_seconds integer;
  v_start_time timestamptz;
  v_end_time timestamptz;
  v_deadline timestamptz;
  v_score numeric(10,2);
  v_max numeric(10,2);
begin
  if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not exists (select 1 from public.profiles where id = v_user and role = 'student' and status = 'active') then
    raise exception 'AUTHORIZATION_REQUIRED';
  end if;

  perform public.finalize_expired_attempts();

  select t.duration_seconds, t.start_time, t.end_time
    into v_duration_seconds, v_start_time, v_end_time
  from public.tests t
  where t.id = p_test_id and t.status = 'published'
    and exists (
      select 1 from public.teacher_student ts
      where ts.teacher_id = t.teacher_id and ts.student_id = v_user and ts.status = 'active'
    );

  if v_duration_seconds is null and v_start_time is null and v_end_time is null
     and not exists (select 1 from public.tests where id = p_test_id) then
    raise exception 'TEST_NOT_AVAILABLE';
  end if;
  if v_start_time is not null and now() < v_start_time then
    raise exception 'TEST_NOT_STARTED' using errcode = '42501';
  end if;
  if v_end_time is not null and now() >= v_end_time then
    raise exception 'TEST_WINDOW_CLOSED' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.tests t
    where t.id = p_test_id and t.status = 'published'
      and exists (
        select 1 from public.teacher_student ts
        where ts.teacher_id = t.teacher_id and ts.student_id = v_user and ts.status = 'active'
      )
  ) then raise exception 'TEST_NOT_AVAILABLE'; end if;

  select id, started_at into v_attempt, v_started_at
  from public.test_attempts
  where test_id = p_test_id and student_id = v_user and status = 'in_progress'
  order by created_at desc
  limit 1
  for update;

  if v_attempt is not null then
    -- Recompute the deadline; an attempt that expired since the sweep is
    -- finalized here instead of being resumed.
    v_deadline := null;
    if v_duration_seconds is not null and v_duration_seconds > 0 and v_started_at is not null then
      v_deadline := v_started_at + make_interval(secs => v_duration_seconds);
    end if;
    if v_deadline is not null and v_end_time is not null and v_end_time < v_deadline then
      v_deadline := v_end_time;
    end if;
    if v_deadline is null then
      v_deadline := v_end_time;
    end if;

    if v_deadline is not null and now() >= v_deadline then
      perform public.finalize_expired_attempts();
      v_attempt := null;
    else
      update public.test_attempts
      set deadline_at = coalesce(deadline_at, v_deadline)
      where id = v_attempt;
    end if;
  end if;

  if v_attempt is null then
    v_deadline := null;
    if v_duration_seconds is not null and v_duration_seconds > 0 then
      v_deadline := now() + make_interval(secs => v_duration_seconds);
    end if;
    if v_deadline is not null and v_end_time is not null and v_end_time < v_deadline then
      v_deadline := v_end_time;
    end if;
    if v_deadline is null then
      v_deadline := v_end_time;
    end if;

    insert into public.test_attempts(test_id, student_id, status, started_at, deadline_at)
    values (p_test_id, v_user, 'in_progress', now(), v_deadline)
    returning id into v_attempt;
  end if;

  return v_attempt;
end;
$$;

-- Deadline-aware save (same signature: body replaced).
create or replace function public.save_test_answer(p_attempt_id uuid, p_question_id uuid, p_answer jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_started_at timestamptz;
  v_duration_seconds integer;
  v_deadline_at timestamptz;
  v_end_time timestamptz;
  v_test_id uuid;
begin
  if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;

  perform public.finalize_expired_attempts();

  select at.test_id, at.started_at, at.deadline_at, t.duration_seconds, t.end_time
    into v_test_id, v_started_at, v_deadline_at, v_duration_seconds, v_end_time
  from public.test_attempts at
  join public.tests t on t.id = at.test_id
  where at.id = p_attempt_id
    and at.student_id = v_user
    and at.status = 'in_progress';

  if v_test_id is null then
    raise exception 'ATTEMPT_NOT_SAVABLE';
  end if;

  if v_started_at is null then
    raise exception 'ATTEMPT_START_TIME_MISSING';
  end if;

  if v_deadline_at is null then
    if v_duration_seconds is not null and v_duration_seconds > 0 then
      v_deadline_at := v_started_at + make_interval(secs => v_duration_seconds);
    end if;
    if v_deadline_at is not null and v_end_time is not null and v_end_time < v_deadline_at then
      v_deadline_at := v_end_time;
    end if;
    if v_deadline_at is null then
      v_deadline_at := v_end_time;
    end if;
  end if;

  if v_deadline_at is not null and now() >= v_deadline_at then
    perform public.finalize_expired_attempts();
    raise exception 'ATTEMPT_TIME_EXPIRED';
  end if;

  if not exists (
    select 1
    from public.test_questions q
    where q.id = p_question_id
      and q.test_id = v_test_id
  ) then
    raise exception 'QUESTION_NOT_IN_ATTEMPT';
  end if;

  insert into public.test_answers (attempt_id, question_id, answer_json, updated_at)
  values (p_attempt_id, p_question_id, p_answer, now())
  on conflict (attempt_id, question_id)
  do update set answer_json = excluded.answer_json, updated_at = now();
end;
$$;

-- Submit with a reason (same single-arg signature preserved via default).
drop function if exists public.submit_test_attempt(uuid);

create or replace function public.submit_test_attempt(p_attempt_id uuid, p_reason text default 'manual')
returns table(score numeric, max_score numeric, status attempt_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_score numeric(10,2);
  v_max numeric(10,2);
  v_started_at timestamptz;
  v_duration_seconds integer;
  v_deadline_at timestamptz;
  v_end_time timestamptz;
  v_test_id uuid;
  v_deadline timestamptz;
  v_submission_time timestamptz;
  v_reason text;
begin
  if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if p_reason is not null and p_reason not in ('manual', 'auto_deadline', 'auto_leave') then
    raise exception 'INVALID_REASON' using errcode = '22023';
  end if;

  perform public.finalize_expired_attempts();

  select at.test_id, at.started_at, at.deadline_at, t.duration_seconds, t.end_time
    into v_test_id, v_started_at, v_deadline_at, v_duration_seconds, v_end_time
  from public.test_attempts at
  join public.tests t on t.id = at.test_id
  where at.id = p_attempt_id
    and at.student_id = v_user
    and at.status = 'in_progress'
  for update;

  if v_test_id is null then raise exception 'ATTEMPT_NOT_SUBMITTABLE'; end if;
  if v_started_at is null then raise exception 'ATTEMPT_START_TIME_MISSING'; end if;

  v_deadline := v_deadline_at;
  if v_deadline is null and v_duration_seconds is not null and v_duration_seconds > 0 then
    v_deadline := v_started_at + make_interval(secs => v_duration_seconds);
  end if;
  if v_deadline is not null and v_end_time is not null and v_end_time < v_deadline then
    v_deadline := v_end_time;
  end if;
  if v_deadline is null then
    v_deadline := v_end_time;
  end if;

  -- The database decides on-time vs late. Late submissions finalize at the
  -- deadline and are recorded as automatic.
  if v_deadline is not null and now() >= v_deadline then
    v_submission_time := v_deadline;
    v_reason := 'auto_deadline';
  else
    v_submission_time := now();
    v_reason := coalesce(p_reason, 'manual');
  end if;

  select coalesce(sum(points),0),
         coalesce(sum(case when a.answer_json = q.correct_answer_json then q.points else 0 end),0)
    into v_max, v_score
  from public.test_attempts at
  join public.test_questions q on q.test_id=at.test_id
  left join public.test_answers a on a.attempt_id=at.id and a.question_id=q.id
  where at.id=p_attempt_id;

  update public.test_answers a
  set awarded_points = case when a.answer_json = q.correct_answer_json then q.points else 0 end,
      feedback = case
        when a.answer_json = q.correct_answer_json then 'Correct.'
        else 'Review this question and try the concept again.'
      end
  from public.test_questions q
  where a.attempt_id=p_attempt_id and a.question_id=q.id;

  update public.test_attempts
  set status='graded', submission_reason=v_reason, score=v_score, max_score=v_max,
      submitted_at=v_submission_time, deadline_at=coalesce(deadline_at, v_deadline)
  where id=p_attempt_id;

  return query select v_score, v_max, 'graded'::public.attempt_status;
end;
$$;

revoke execute on function public.submit_test_attempt(uuid, text) from public, anon;
grant execute on function public.submit_test_attempt(uuid, text) to authenticated;

-- Teacher scheduling control: set or clear the test window. Allowed on
-- drafts and published tests owned by the caller (or admin). Publishing a
-- test with a future start keeps it hidden until the window opens.
drop function if exists public.schedule_test(uuid, timestamptz, timestamptz);

create or replace function public.schedule_test(
  p_test_id uuid,
  p_start_time timestamptz default null,
  p_end_time timestamptz default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if p_test_id is null then raise exception 'INVALID_TEST' using errcode = '22023'; end if;
  if p_start_time is not null and p_end_time is not null and p_end_time <= p_start_time then
    raise exception 'INVALID_WINDOW' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.tests
    where id = p_test_id and (teacher_id = v_user or public.is_admin())
  ) then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
  end if;

  update public.tests
  set start_time = p_start_time, end_time = p_end_time, updated_at = now()
  where id = p_test_id;
  return true;
end;
$$;

revoke execute on function public.schedule_test(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.schedule_test(uuid, timestamptz, timestamptz) to authenticated;

-- Security-event logging from the player (heartbeat / visibility / leave).
drop function if exists public.log_test_security_event(uuid, text, jsonb);

create or replace function public.log_test_security_event(
  p_attempt_id uuid,
  p_event_type text,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if p_attempt_id is null then raise exception 'INVALID_ATTEMPT' using errcode = '22023'; end if;
  if p_event_type is not null and p_event_type not in
    ('visibility_hidden', 'visibility_visible', 'focus_blur', 'focus_focus',
     'fullscreen_exit', 'fullscreen_enter', 'heartbeat', 'leave_finalize',
     'signout_finalize', 'deadline_finalize') then
    raise exception 'INVALID_EVENT' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.test_attempts
    where id = p_attempt_id and student_id = v_user and status = 'in_progress'
  ) then
    raise exception 'ATTEMPT_NOT_ACTIVE' using errcode = '42501';
  end if;

  insert into public.test_security_events (attempt_id, student_id, event_type, metadata_json)
  values (p_attempt_id, v_user, p_event_type, coalesce(p_metadata, '{}'::jsonb));
  return true;
end;
$$;

revoke execute on function public.log_test_security_event(uuid, text, jsonb) from public, anon;
grant execute on function public.log_test_security_event(uuid, text, jsonb) to authenticated;

-- H ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('study-materials', 'study-materials', false),
       ('assessments', 'assessments', false)
on conflict (id) do nothing;

-- Teachers manage their own prefix: <teacher_uuid>/<material_uuid>/...
drop policy if exists sm_teacher_manage on storage.objects;
create policy sm_teacher_manage on storage.objects
for all
using (
  bucket_id = 'study-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'study-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Assigned students may download READY materials of their teachers.
drop policy if exists sm_student_read on storage.objects;
create policy sm_student_read on storage.objects
for select
using (
  bucket_id = 'study-materials'
  and exists (
    select 1
    from public.study_materials m
    join public.teacher_student ts on ts.teacher_id = m.teacher_id
    where ts.student_id = auth.uid()
      and ts.status = 'active'
      and m.processing_status = 'ready'
      and m.storage_path = storage.objects.name
  )
);

drop policy if exists sm_admin_all on storage.objects;
create policy sm_admin_all on storage.objects
for all
using (
  bucket_id = 'study-materials'
  and public.is_admin()
)
with check (
  bucket_id = 'study-materials'
  and public.is_admin()
);

-- Assessment PDFs: same teacher-prefix management; students only inside the
-- published window of a test they are assigned to.
drop policy if exists assess_teacher_manage on storage.objects;
create policy assess_teacher_manage on storage.objects
for all
using (
  bucket_id = 'assessments'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'assessments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists assess_student_windowed_read on storage.objects;
create policy assess_student_windowed_read on storage.objects
for select
using (
  bucket_id = 'assessments'
  and exists (
    select 1
    from public.tests t
    join public.teacher_student ts on ts.teacher_id = t.teacher_id
    where ts.student_id = auth.uid()
      and ts.status = 'active'
      and t.status = 'published'
      and t.assessment_pdf_path = storage.objects.name
      and (t.start_time is null or now() >= t.start_time)
      and (t.end_time is null or now() < t.end_time)
  )
);

drop policy if exists assess_admin_all on storage.objects;
create policy assess_admin_all on storage.objects
for all
using (
  bucket_id = 'assessments'
  and public.is_admin()
)
with check (
  bucket_id = 'assessments'
  and public.is_admin()
);
