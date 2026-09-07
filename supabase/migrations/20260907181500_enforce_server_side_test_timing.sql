-- Enforce assessment timing in the database so the browser timer is never authoritative.
-- Expired in-progress attempts are graded from persisted answers when submission/resume occurs.

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
  v_test_id uuid;
begin
  if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;

  select at.test_id, at.started_at, t.duration_seconds
    into v_test_id, v_started_at, v_duration_seconds
  from public.test_attempts at
  join public.tests t on t.id = at.test_id
  where at.id = p_attempt_id
    and at.student_id = v_user
    and at.status = 'in_progress';

  if v_test_id is null then raise exception 'ATTEMPT_NOT_SAVABLE'; end if;
  if v_started_at is null then raise exception 'ATTEMPT_START_TIME_MISSING'; end if;

  if v_duration_seconds is not null
     and v_duration_seconds > 0
     and now() >= v_started_at + make_interval(secs => v_duration_seconds) then
    raise exception 'ATTEMPT_TIME_EXPIRED';
  end if;

  if not exists (
    select 1 from public.test_questions q
    where q.id = p_question_id and q.test_id = v_test_id
  ) then
    raise exception 'QUESTION_NOT_IN_ATTEMPT';
  end if;

  insert into public.test_answers (attempt_id, question_id, answer_json, updated_at)
  values (p_attempt_id, p_question_id, p_answer, now())
  on conflict (attempt_id, question_id)
  do update set answer_json = excluded.answer_json, updated_at = now();
end;
$$;

create or replace function public.submit_test_attempt(p_attempt_id uuid)
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
  v_test_id uuid;
begin
  if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;

  select at.test_id, at.started_at, t.duration_seconds
    into v_test_id, v_started_at, v_duration_seconds
  from public.test_attempts at
  join public.tests t on t.id = at.test_id
  where at.id = p_attempt_id
    and at.student_id = v_user
    and at.status = 'in_progress'
  for update;

  if v_test_id is null then raise exception 'ATTEMPT_NOT_SUBMITTABLE'; end if;
  if v_started_at is null then raise exception 'ATTEMPT_START_TIME_MISSING'; end if;

  select coalesce(sum(points),0),
         coalesce(sum(case when a.answer_json = q.correct_answer_json then q.points else 0 end),0)
    into v_max, v_score
  from public.test_attempts at
  join public.test_questions q on q.test_id=at.test_id
  left join public.test_answers a on a.attempt_id=at.id and a.question_id=q.id
  where at.id=p_attempt_id;

  update public.test_answers a
  set awarded_points = case when a.answer_json = q.correct_answer_json then q.points else 0 end,
      feedback = case when a.answer_json = q.correct_answer_json then 'Correct.' else 'Review this question and try the concept again.' end
  from public.test_questions q
  where a.attempt_id=p_attempt_id and a.question_id=q.id;

  update public.test_attempts
  set status='graded', score=v_score, max_score=v_max, submitted_at=now()
  where id=p_attempt_id;

  return query select v_score, v_max, 'graded'::public.attempt_status;
end;
$$;

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
  v_score numeric(10,2);
  v_max numeric(10,2);
begin
  if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not exists (select 1 from public.profiles where id = v_user and role = 'student' and status = 'active') then
    raise exception 'AUTHORIZATION_REQUIRED';
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
    select t.id, t.duration_seconds into v_test_id, v_duration_seconds
    from public.tests t where t.id = p_test_id;

    if v_started_at is not null
       and v_duration_seconds is not null
       and v_duration_seconds > 0
       and now() >= v_started_at + make_interval(secs => v_duration_seconds) then
      select coalesce(sum(q.points),0),
             coalesce(sum(case when a.answer_json = q.correct_answer_json then q.points else 0 end),0)
        into v_max, v_score
      from public.test_questions q
      left join public.test_answers a on a.attempt_id = v_attempt and a.question_id = q.id
      where q.test_id = p_test_id;

      update public.test_answers a
      set awarded_points = case when a.answer_json = q.correct_answer_json then q.points else 0 end,
          feedback = case when a.answer_json = q.correct_answer_json then 'Correct.' else 'Review this question and try the concept again.' end
      from public.test_questions q
      where a.attempt_id = v_attempt and a.question_id = q.id;

      update public.test_attempts
      set status='graded', score=v_score, max_score=v_max, submitted_at=now()
      where id=v_attempt;

      v_attempt := null;
    end if;
  end if;

  if v_attempt is null then
    insert into public.test_attempts(test_id, student_id, status, started_at)
    values (p_test_id, v_user, 'in_progress', now())
    returning id into v_attempt;
  end if;

  return v_attempt;
end;
$$;

revoke execute on function public.save_test_answer(uuid, uuid, jsonb) from anon;
revoke execute on function public.submit_test_attempt(uuid) from anon;
revoke execute on function public.start_test_attempt(uuid) from anon;
grant execute on function public.save_test_answer(uuid, uuid, jsonb) to authenticated;
grant execute on function public.submit_test_attempt(uuid) to authenticated;
grant execute on function public.start_test_attempt(uuid) to authenticated;
