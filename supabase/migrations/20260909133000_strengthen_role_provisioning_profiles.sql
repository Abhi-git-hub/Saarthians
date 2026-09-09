alter table public.profiles
  add column if not exists username text,
  add column if not exists phone text,
  add column if not exists grade_level text,
  add column if not exists subject text;

create unique index if not exists profiles_username_ci_unique
  on public.profiles (lower(username))
  where username is not null;

alter table public.profiles
  add constraint profiles_username_format_check
  check (username is null or username ~ '^[a-z0-9](?:[a-z0-9._-]{2,29})$');

alter table public.profiles
  add constraint profiles_phone_length_check
  check (phone is null or char_length(phone) between 7 and 32);

alter table public.profiles
  add constraint profiles_grade_level_length_check
  check (grade_level is null or char_length(grade_level) between 1 and 40);

alter table public.profiles
  add constraint profiles_subject_length_check
  check (subject is null or char_length(subject) between 1 and 120);
