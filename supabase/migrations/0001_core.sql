create extension if not exists pgcrypto;

create type public.app_role as enum ('student','teacher','admin');
create type public.user_status as enum ('active','suspended','pending');
create type public.note_visibility as enum ('private','shared','published');
create type public.content_status as enum ('draft','published','archived');
create type public.attempt_status as enum ('created','in_progress','submitted','graded','reviewed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role public.app_role not null default 'student',
  status public.user_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teacher_student (
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  primary key (teacher_id, student_id),
  check (teacher_id <> student_id)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  content text not null default '',
  visibility public.note_visibility not null default 'private',
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.note_shares (
  note_id uuid not null references public.notes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  shared_by_user_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (note_id, student_id)
);

create table public.tests (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  instructions text not null default '',
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  type text not null,
  prompt text not null,
  options_json jsonb,
  correct_answer_json jsonb not null,
  points numeric(10,2) not null check (points >= 0),
  position integer not null check (position >= 0),
  unique (test_id, position)
);

create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete restrict,
  student_id uuid not null references public.profiles(id) on delete restrict,
  status public.attempt_status not null default 'created',
  started_at timestamptz,
  submitted_at timestamptz,
  score numeric(10,2),
  max_score numeric(10,2),
  created_at timestamptz not null default now()
);

create table public.test_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.test_attempts(id) on delete cascade,
  question_id uuid not null references public.test_questions(id) on delete restrict,
  answer_json jsonb,
  awarded_points numeric(10,2),
  feedback text,
  unique (attempt_id, question_id)
);

create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  context_metadata_json jsonb,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata_json jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index notes_owner_idx on public.notes(owner_user_id);
create index note_shares_student_idx on public.note_shares(student_id);
create index tests_teacher_idx on public.tests(teacher_id);
create index attempts_student_idx on public.test_attempts(student_id);
create index attempts_test_idx on public.test_attempts(test_id);
create index chat_user_idx on public.chat_conversations(user_id);
create index audit_actor_idx on public.audit_events(actor_user_id);

alter table public.profiles enable row level security;
alter table public.teacher_student enable row level security;
alter table public.notes enable row level security;
alter table public.note_shares enable row level security;
alter table public.tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_attempts enable row level security;
alter table public.test_answers enable row level security;
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.audit_events enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active');
$$;

create or replace function public.is_teacher_of(target_student uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.teacher_student where teacher_id = auth.uid() and student_id = target_student and status = 'active');
$$;

create policy profiles_self_or_admin on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_self on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy teacher_student_participants on public.teacher_student for select using (teacher_id = auth.uid() or student_id = auth.uid() or public.is_admin());
create policy notes_owner_read on public.notes for select using (owner_user_id = auth.uid() or public.is_admin());
create policy notes_owner_write on public.notes for all using (owner_user_id = auth.uid() or public.is_admin()) with check (owner_user_id = auth.uid() or public.is_admin());
create policy notes_shared_read on public.notes for select using (exists(select 1 from public.note_shares ns where ns.note_id = notes.id and ns.student_id = auth.uid()) or (visibility = 'published' and status = 'published'));
create policy note_shares_authorized on public.note_shares for select using (student_id = auth.uid() or shared_by_user_id = auth.uid() or public.is_admin());

create policy tests_teacher_read on public.tests for select using (teacher_id = auth.uid() or public.is_admin() or (status = 'published' and exists(select 1 from public.teacher_student ts where ts.teacher_id = tests.teacher_id and ts.student_id = auth.uid() and ts.status = 'active')));
create policy tests_teacher_write on public.tests for all using (teacher_id = auth.uid() or public.is_admin()) with check (teacher_id = auth.uid() or public.is_admin());
create policy questions_authorized on public.test_questions for select using (exists(select 1 from public.tests t where t.id = test_id and (t.teacher_id = auth.uid() or public.is_admin() or (t.status = 'published' and exists(select 1 from public.teacher_student ts where ts.teacher_id=t.teacher_id and ts.student_id=auth.uid() and ts.status='active')))));
create policy attempts_student_or_teacher on public.test_attempts for select using (student_id = auth.uid() or exists(select 1 from public.tests t where t.id=test_id and t.teacher_id=auth.uid()) or public.is_admin());
create policy answers_student_or_teacher on public.test_answers for select using (exists(select 1 from public.test_attempts a join public.tests t on t.id=a.test_id where a.id=attempt_id and (a.student_id=auth.uid() or t.teacher_id=auth.uid() or public.is_admin())));

create policy chat_own_conversations on public.chat_conversations for all using (user_id=auth.uid() or public.is_admin()) with check (user_id=auth.uid() or public.is_admin());
create policy chat_own_messages on public.chat_messages for all using (exists(select 1 from public.chat_conversations c where c.id=conversation_id and c.user_id=auth.uid()) or public.is_admin()) with check (exists(select 1 from public.chat_conversations c where c.id=conversation_id and c.user_id=auth.uid()) or public.is_admin());
create policy audit_admin_read on public.audit_events for select using (public.is_admin() or actor_user_id=auth.uid());
