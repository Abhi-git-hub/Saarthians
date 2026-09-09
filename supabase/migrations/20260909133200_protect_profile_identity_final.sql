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

revoke execute on function public.protect_profile_authorization_fields() from public, anon, authenticated;
