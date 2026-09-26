-- Simple score recording: teacher picks a student, types a subject and
-- marks; the database files it under that student's dashboard.
--
-- No test containers for the teacher to manage: this RPC finds the
-- teacher's most recent published test with the same subject title, or
-- creates and publishes one on the spot. Attempts always store their own
-- max_score, so changing totals later never rewrites history.

drop function if exists public.record_score_simple(uuid, text, numeric, numeric);

create or replace function public.record_score_simple(
  p_student_id uuid,
  p_subject text,
  p_obtained numeric,
  p_total numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_subject text := btrim(coalesce(p_subject, ''));
  v_test uuid;
  v_attempt uuid;
begin
  if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if p_student_id is null then raise exception 'INVALID_STUDENT' using errcode = '22023'; end if;
  if char_length(v_subject) < 1 or char_length(v_subject) > 100 then
    raise exception 'INVALID_SUBJECT' using errcode = '22023';
  end if;
  if p_total is null or p_total <= 0 or p_total > 10000 then
    raise exception 'INVALID_TOTAL' using errcode = '22023';
  end if;
  if p_obtained is null or p_obtained < 0 or p_obtained > p_total then
    raise exception 'INVALID_SCORE' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = v_user and role in ('teacher', 'admin') and status = 'active'
  ) then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
  end if;

  -- Teachers score only their assigned students (admins bypass).
  if not public.is_admin() and not exists (
    select 1 from public.teacher_student ts
    where ts.teacher_id = v_user and ts.student_id = p_student_id and ts.status = 'active'
  ) then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.profiles where id = p_student_id and role = 'student' and status = 'active'
  ) then
    raise exception 'STUDENT_NOT_FOUND' using errcode = '22023';
  end if;

  -- Reuse the latest published test with this subject title; otherwise
  -- create and publish one immediately (scorebook needs no questions).
  select id into v_test
  from public.tests
  where teacher_id = v_user and status = 'published' and lower(title) = lower(v_subject)
  order by created_at desc
  limit 1
  for update;

  if v_test is null then
    insert into public.tests (teacher_id, title, instructions, status, max_marks, published_at)
    values (v_user, v_subject, 'Scores recorded from offline class tests.', 'published', p_total, now())
    returning id into v_test;
  else
    update public.tests set max_marks = p_total, updated_at = now() where id = v_test;
  end if;

  -- One graded record per student per test: refresh the latest terminal
  -- attempt (corrections overwrite), never touch an in-progress one.
  select id into v_attempt
  from public.test_attempts
  where test_id = v_test and student_id = p_student_id and status <> 'in_progress'
  order by created_at desc
  limit 1
  for update;

  if v_attempt is not null then
    update public.test_attempts
    set status = 'graded',
        submission_reason = 'manual',
        score = p_obtained,
        max_score = p_total,
        submitted_at = now()
    where id = v_attempt;
  else
    insert into public.test_attempts (test_id, student_id, status, submission_reason, score, max_score, submitted_at, started_at)
    values (v_test, p_student_id, 'graded', 'manual', p_obtained, p_total, now(), now())
    returning id into v_attempt;
  end if;

  return v_attempt;
end;
$$;

revoke execute on function public.record_score_simple(uuid, text, numeric, numeric) from public, anon;
grant execute on function public.record_score_simple(uuid, text, numeric, numeric) to authenticated;
