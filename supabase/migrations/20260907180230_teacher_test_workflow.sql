create or replace function public.create_teacher_test(
  p_title text,
  p_instructions text default '',
  p_duration_seconds integer default null
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if not exists (select 1 from public.profiles where id=v_user and role in ('teacher','admin') and status='active') then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode='42501';
  end if;
  if p_title is null or char_length(trim(p_title)) not between 1 and 200 then
    raise exception 'INVALID_TITLE' using errcode='22023';
  end if;
  if p_duration_seconds is not null and p_duration_seconds <= 0 then
    raise exception 'INVALID_DURATION' using errcode='22023';
  end if;
  insert into public.tests(teacher_id,title,instructions,duration_seconds,status)
  values(v_user,trim(p_title),coalesce(p_instructions,''),p_duration_seconds,'draft')
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.create_test_question(
  p_test_id uuid,
  p_type text,
  p_prompt text,
  p_options jsonb,
  p_correct_answer jsonb,
  p_points numeric,
  p_position integer
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if not exists (select 1 from public.tests where id=p_test_id and teacher_id=v_user and status='draft')
     and not public.is_admin() then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode='42501';
  end if;
  if p_prompt is null or char_length(trim(p_prompt)) = 0 then raise exception 'INVALID_PROMPT' using errcode='22023'; end if;
  if p_points is null or p_points < 0 then raise exception 'INVALID_POINTS' using errcode='22023'; end if;
  if p_position is null or p_position < 0 then raise exception 'INVALID_POSITION' using errcode='22023'; end if;
  insert into public.test_questions(test_id,type,prompt,options_json,correct_answer_json,points,position)
  values(p_test_id,p_type,trim(p_prompt),p_options,p_correct_answer,p_points,p_position)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.publish_teacher_test(p_test_id uuid) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_questions integer;
begin
  if not exists (select 1 from public.tests where id=p_test_id and (teacher_id=v_user or public.is_admin()) and status='draft') then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode='42501';
  end if;
  select count(*) into v_questions from public.test_questions where test_id=p_test_id;
  if v_questions < 1 then raise exception 'TEST_REQUIRES_QUESTION' using errcode='22023'; end if;
  update public.tests set status='published', published_at=now(), updated_at=now() where id=p_test_id;
  return true;
end;
$$;

revoke execute on function public.create_teacher_test(text,text,integer) from public, anon;
revoke execute on function public.create_test_question(uuid,text,text,jsonb,jsonb,numeric,integer) from public, anon;
revoke execute on function public.publish_teacher_test(uuid) from public, anon;
grant execute on function public.create_teacher_test(text,text,integer) to authenticated;
grant execute on function public.create_test_question(uuid,text,text,jsonb,jsonb,numeric,integer) to authenticated;
grant execute on function public.publish_teacher_test(uuid) to authenticated;
