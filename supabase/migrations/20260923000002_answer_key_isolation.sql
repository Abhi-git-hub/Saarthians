-- Answer-key isolation.
--
-- test_questions.correct_answer_json was readable by every assigned student
-- on published tests (the SELECT policy must expose questions to play).
-- Application code selected keyless columns, but direct API access leaked
-- keys. Keys now live in test_question_keys, readable only by the owning
-- teacher, admins, and students reviewing their own finished attempts
-- (submitted/graded/reviewed). All writes flow through SECURITY DEFINER
-- RPCs, which bypass RLS; no client write policy exists on purpose.

create table if not exists public.test_question_keys (
  question_id uuid primary key references public.test_questions (id) on delete cascade,
  correct_answer_json jsonb not null default 'null'::jsonb
);

insert into public.test_question_keys (question_id, correct_answer_json)
select id, correct_answer_json from public.test_questions
on conflict (question_id) do nothing;

alter table public.test_question_keys enable row level security;

drop policy if exists test_question_keys_access on public.test_question_keys;
create policy test_question_keys_access on public.test_question_keys
for select
using (
  exists (
    select 1
    from public.test_questions q
    join public.tests t on t.id = q.test_id
    where q.id = test_question_keys.question_id
      and (
        t.teacher_id = auth.uid()
        or public.is_admin()
        or exists (
          select 1 from public.test_attempts at
          where at.test_id = t.id
            and at.student_id = auth.uid()
            and at.status in ('submitted', 'graded', 'reviewed')
        )
      )
  )
);

-- Rewrite scoring RPCs to read keys from the new table (same signatures).
create or replace function public.upsert_test_question(
  p_question_id uuid default null,
  p_test_id uuid default null,
  p_type text default null,
  p_prompt text default null,
  p_options jsonb default null,
  p_correct jsonb default null,
  p_points numeric default null,
  p_position integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_teacher uuid;
  v_status public.content_status;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;
  if p_test_id is null then
    raise exception 'INVALID_TEST' using errcode = '22023';
  end if;

  select teacher_id, status into v_teacher, v_status
  from public.tests
  where id = p_test_id;

  if v_teacher is null then
    raise exception 'TEST_NOT_FOUND' using errcode = '22023';
  end if;
  if v_teacher <> v_user and not public.is_admin() then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
  end if;
  if v_status <> 'draft' then
    raise exception 'TEST_NOT_EDITABLE' using errcode = '42501';
  end if;

  if p_type is null or p_type not in ('mcq', 'short_answer') then
    raise exception 'INVALID_PROMPT' using errcode = '22023';
  end if;
  if p_prompt is null or char_length(btrim(p_prompt)) < 1 or char_length(p_prompt) > 5000 then
    raise exception 'INVALID_PROMPT' using errcode = '22023';
  end if;
  if p_points is null or p_points < 0 or p_points > 1000 then
    raise exception 'INVALID_POINTS' using errcode = '22023';
  end if;
  if p_position is null or p_position < 0 or p_position > 1000 then
    raise exception 'INVALID_POSITION' using errcode = '22023';
  end if;

  if p_question_id is null then
    insert into public.test_questions (test_id, type, prompt, options_json, points, position)
    values (p_test_id, p_type, btrim(p_prompt), p_options, p_points, p_position)
    returning id into v_id;
    insert into public.test_question_keys (question_id, correct_answer_json)
    values (v_id, coalesce(p_correct, 'null'::jsonb));
    return v_id;
  end if;

  update public.test_questions
  set type = p_type,
      prompt = btrim(p_prompt),
      options_json = p_options,
      points = p_points,
      position = p_position
  where id = p_question_id
    and test_id = p_test_id
  returning id into v_id;

  if v_id is null then
    raise exception 'QUESTION_NOT_FOUND' using errcode = '22023';
  end if;
  insert into public.test_question_keys (question_id, correct_answer_json)
  values (v_id, coalesce(p_correct, 'null'::jsonb))
  on conflict (question_id)
  do update set correct_answer_json = excluded.correct_answer_json;
  return v_id;
end;
$$;

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

  if v_deadline is not null and now() >= v_deadline then
    v_submission_time := v_deadline;
    v_reason := 'auto_deadline';
  else
    v_submission_time := now();
    v_reason := coalesce(p_reason, 'manual');
  end if;

  select coalesce(sum(q.points),0),
         coalesce(sum(case when a.answer_json = k.correct_answer_json then q.points else 0 end),0)
    into v_max, v_score
  from public.test_attempts at
  join public.test_questions q on q.test_id=at.test_id
  join public.test_question_keys k on k.question_id=q.id
  left join public.test_answers a on a.attempt_id=at.id and a.question_id=q.id
  where at.id=p_attempt_id;

  update public.test_answers a
  set awarded_points = case when a.answer_json = k.correct_answer_json then q.points else 0 end,
      feedback = case
        when a.answer_json = k.correct_answer_json then 'Correct.'
        else 'Review this question and try the concept again.'
      end
  from public.test_questions q
  join public.test_question_keys k on k.question_id=q.id
  where a.attempt_id=p_attempt_id and a.question_id=q.id;

  update public.test_attempts
  set status='graded', submission_reason=v_reason, score=v_score, max_score=v_max,
      submitted_at=v_submission_time, deadline_at=coalesce(deadline_at, v_deadline)
  where id=p_attempt_id;

  return query select v_score, v_max, 'graded'::public.attempt_status;
end;
$$;

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
             coalesce(sum(case when a.answer_json = k.correct_answer_json then q.points else 0 end),0)
        into v_max, v_score
      from public.test_questions q
      join public.test_question_keys k on k.question_id=q.id
      left join public.test_answers a on a.attempt_id = r.id and a.question_id = q.id
      where q.test_id = r.test_id;

      update public.test_answers a
      set awarded_points = case when a.answer_json = k.correct_answer_json then q.points else 0 end,
          feedback = case when a.answer_json = k.correct_answer_json then 'Correct.' else 'Review this question and try the concept again.' end
      from public.test_questions q
      join public.test_question_keys k on k.question_id=q.id
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

-- Expire-resume path inside start_test_attempt uses the same join.
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

-- Drop the exposed column only after every reader uses the keys table.
alter table public.test_questions drop column if exists correct_answer_json;

revoke execute on function public.upsert_test_question(uuid, uuid, text, text, jsonb, jsonb, numeric, integer) from public, anon;
grant execute on function public.upsert_test_question(uuid, uuid, text, text, jsonb, jsonb, numeric, integer) to authenticated;
revoke execute on function public.submit_test_attempt(uuid, text) from public, anon;
grant execute on function public.submit_test_attempt(uuid, text) to authenticated;
revoke execute on function public.finalize_expired_attempts() from public, anon;
grant execute on function public.finalize_expired_attempts() to authenticated;
revoke execute on function public.start_test_attempt(uuid) from public, anon;
grant execute on function public.start_test_attempt(uuid) to authenticated;
