-- Make the submit RPC explicitly deadline-aware.
-- Expired attempts are finalized using the server deadline as submitted_at,
-- so a client cannot extend an assessment by delaying the submit request.

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
  v_deadline timestamptz;
  v_submission_time timestamptz;
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

  v_deadline := case
    when v_duration_seconds is not null and v_duration_seconds > 0
      then v_started_at + make_interval(secs => v_duration_seconds)
    else null
  end;

  -- The database decides whether this was on-time or late. Late submissions
  -- are accepted only as automatic finalization of the expired attempt.
  v_submission_time := case
    when v_deadline is not null and now() >= v_deadline then v_deadline
    else now()
  end;

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
  set status='graded', score=v_score, max_score=v_max, submitted_at=v_submission_time
  where id=p_attempt_id;

  return query select v_score, v_max, 'graded'::public.attempt_status;
end;
$$;

revoke execute on function public.submit_test_attempt(uuid) from anon;
grant execute on function public.submit_test_attempt(uuid) to authenticated;
