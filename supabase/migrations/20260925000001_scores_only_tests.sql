-- Scores-only assessment model.
--
-- Product decision: students no longer take tests online. Teachers record
-- scores from offline tests; students see scores, results, and progress.
-- Nothing historical is destroyed: attempts/answers/questions/RPCs stay
-- intact and the tutor keeps working from score-level data.
--
--   * tests.max_marks: ceiling for score-only tests (no questions needed).
--   * record_student_score(): teacher/admin upserts one graded attempt for
--     an assigned student. Clamps 0 <= score <= max.
--   * publish_teacher_test(): a test may now publish with zero questions
--     when max_marks is set (scorebook mode); question tests keep the old
--     requirement.

alter table public.tests
  add column if not exists max_marks numeric null
    check (max_marks is null or max_marks > 0);

drop function if exists public.record_student_score(uuid, uuid, numeric);

create or replace function public.record_student_score(
  p_test_id uuid,
  p_student_id uuid,
  p_score numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_teacher uuid;
  v_max numeric;
  v_attempt uuid;
begin
  if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if p_test_id is null or p_student_id is null then
    raise exception 'INVALID_TEST' using errcode = '22023';
  end if;
  if p_score is null or p_score < 0 then
    raise exception 'INVALID_SCORE' using errcode = '22023';
  end if;

  select teacher_id into v_teacher from public.tests where id = p_test_id;
  if v_teacher is null then raise exception 'TEST_NOT_FOUND' using errcode = '22023'; end if;
  if v_teacher <> v_user and not public.is_admin() then
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

  select coalesce(
    (select max_marks from public.tests where id = p_test_id),
    (select coalesce(sum(points), 0) from public.test_questions where test_id = p_test_id)
  ) into v_max;
  if v_max is null or v_max <= 0 then
    raise exception 'TEST_HAS_NO_MAX' using errcode = '22023';
  end if;
  if p_score > v_max then
    raise exception 'SCORE_ABOVE_MAX' using errcode = '22023';
  end if;

  -- One graded record per student per test: refresh the latest terminal
  -- attempt (corrections overwrite), never touch an in-progress one.
  select id into v_attempt
  from public.test_attempts
  where test_id = p_test_id and student_id = p_student_id and status <> 'in_progress'
  order by created_at desc
  limit 1
  for update;

  if v_attempt is not null then
    update public.test_attempts
    set status = 'graded',
        submission_reason = 'manual',
        score = p_score,
        max_score = v_max,
        submitted_at = now()
    where id = v_attempt;
  else
    insert into public.test_attempts (test_id, student_id, status, submission_reason, score, max_score, submitted_at, started_at)
    values (p_test_id, p_student_id, 'graded', 'manual', p_score, v_max, now(), now())
    returning id into v_attempt;
  end if;

  return v_attempt;
end;
$$;

revoke execute on function public.record_student_score(uuid, uuid, numeric) from public, anon;
grant execute on function public.record_student_score(uuid, uuid, numeric) to authenticated;

-- Scorebook publishing: questions OR max_marks required (was: questions).
create or replace function public.publish_teacher_test(p_test_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_questions integer;
  v_max numeric;
begin
  if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not exists (select 1 from public.tests where id=p_test_id and (teacher_id=v_user or public.is_admin()) and status='draft') then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
  end if;
  select count(*) into v_questions from public.test_questions where test_id=p_test_id;
  select max_marks into v_max from public.tests where id=p_test_id;
  if v_questions < 1 and (v_max is null or v_max <= 0) then
    raise exception 'TEST_REQUIRES_QUESTION_OR_MAX' using errcode = '22023';
  end if;
  update public.tests set status='published', published_at=now(), updated_at=now() where id=p_test_id;
  return true;
end;
$$;

revoke execute on function public.publish_teacher_test(uuid) from public, anon;
grant execute on function public.publish_teacher_test(uuid) to authenticated;
