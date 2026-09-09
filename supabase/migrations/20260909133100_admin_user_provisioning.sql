create or replace function public.protect_profile_authorization_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role
    or old.status is distinct from new.status
    or old.username is distinct from new.username then
    if not exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role = 'admin'
        and status = 'active'
    ) then
      raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.admin_provision_profile(
  p_user_id uuid,
  p_display_name text,
  p_username text,
  p_role public.app_role,
  p_phone text default null,
  p_grade_level text default null,
  p_subject text default null
)
returns public.profiles
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
    raise exception 'USERNAME_TAKEN';
  end if;

  update public.profiles
  set display_name = left(trim(p_display_name),120),
      username = clean_username,
      role = p_role,
      status = 'active',
      phone = nullif(left(trim(coalesce(p_phone,'')),32),''),
      grade_level = case when p_role='student' then nullif(left(trim(coalesce(p_grade_level,'')),40),'') else null end,
      subject = case when p_role='teacher' then nullif(left(trim(coalesce(p_subject,'')),120),'') else null end,
      updated_at = now()
  where id = p_user_id
  returning * into result;

  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;

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

revoke execute on function public.protect_profile_authorization_fields() from public, anon, authenticated;
revoke execute on function public.admin_provision_profile(uuid,text,text,public.app_role,text,text,text) from public, anon;
grant execute on function public.admin_provision_profile(uuid,text,text,public.app_role,text,text,text) to authenticated;
