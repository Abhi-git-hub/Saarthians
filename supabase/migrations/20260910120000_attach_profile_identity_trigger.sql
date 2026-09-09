-- Attach the profile identity guard to public.profiles.
--
-- The protect_profile_authorization_fields() function already ships in
-- 20260909133200, but the CREATE TRIGGER was never captured in migrations even
-- though production has it attached (as protect_profile_authorization_fields).
-- This closes that drift. Idempotent and backward-compatible: re-running only
-- re-attaches the same guard.
--
-- The guard blocks role/status/username changes unless the caller is an active
-- admin, so database-level privilege escalation stays impossible even for
-- service_role REST calls (which carry no end-user JWT).

drop trigger if exists protect_profile_authorization_fields on public.profiles;

create trigger protect_profile_authorization_fields
before update on public.profiles
for each row execute function public.protect_profile_authorization_fields();
