-- Teacher question authoring for the test editor.
--
-- The editor (lib/teacher-test.ts) calls upsert_test_question and
-- delete_test_question, which never existed in any migration, so every
-- add/edit/delete action failed. These functions close that gap following the
-- established server-authoritative pattern (SECURITY DEFINER + explicit
-- ownership checks, like save_test_answer):
--   * caller must own the parent test (or be an active admin),
--   * the parent test must still be a draft (published tests are immutable),
--   * inputs are validated server-side,
--   * revoked from anon/public, granted only to authenticated.

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
    insert into public.test_questions (test_id, type, prompt, options_json, correct_answer_json, points, position)
    values (p_test_id, p_type, btrim(p_prompt), p_options, coalesce(p_correct, 'null'::jsonb), p_points, p_position)
    returning id into v_id;
    return v_id;
  end if;

  update public.test_questions
  set type = p_type,
      prompt = btrim(p_prompt),
      options_json = p_options,
      correct_answer_json = coalesce(p_correct, 'null'::jsonb),
      points = p_points,
      position = p_position
  where id = p_question_id
    and test_id = p_test_id
  returning id into v_id;

  if v_id is null then
    raise exception 'QUESTION_NOT_FOUND' using errcode = '22023';
  end if;
  return v_id;
end;
$$;

create or replace function public.delete_test_question(p_question_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_test uuid;
  v_teacher uuid;
  v_status public.content_status;
begin
  if v_user is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;
  if p_question_id is null then
    raise exception 'INVALID_QUESTION' using errcode = '22023';
  end if;

  select q.test_id, t.teacher_id, t.status into v_test, v_teacher, v_status
  from public.test_questions q
  join public.tests t on t.id = q.test_id
  where q.id = p_question_id;

  if v_test is null then
    raise exception 'QUESTION_NOT_FOUND' using errcode = '22023';
  end if;
  if v_teacher <> v_user and not public.is_admin() then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
  end if;
  if v_status <> 'draft' then
    raise exception 'TEST_NOT_EDITABLE' using errcode = '42501';
  end if;

  delete from public.test_questions where id = p_question_id;
  return true;
end;
$$;

revoke execute on function public.upsert_test_question(uuid, uuid, text, text, jsonb, jsonb, numeric, integer) from public, anon;
revoke execute on function public.delete_test_question(uuid) from public, anon;
grant execute on function public.upsert_test_question(uuid, uuid, text, text, jsonb, jsonb, numeric, integer) to authenticated;
grant execute on function public.delete_test_question(uuid) to authenticated;
