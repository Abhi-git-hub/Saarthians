-- Teacher roster readability.
--
-- profiles currently allows SELECT only to the row owner (or admin), which
-- means the teacher roster's profile join always resolves to null: teachers
-- see "Unnamed student" for real assigned learners. This narrowly-scoped
-- policy lets a teacher read profile rows of students actively assigned to
-- them through teacher_student — the same relationship that already gates
-- every other teacher/student surface (tests, attempts, answers, shares).
-- No other policy is altered. Teachers still cannot read unassigned students,
-- cannot write profiles (update policy untouched), and the assigned-student
-- check requires status = 'active'.
-- Note: assigned teachers can see basic profile fields including phone, which
-- matches normal coaching operations (teachers call their own students).

create policy profiles_teacher_assigned on public.profiles
for select
using (
  exists (
    select 1 from public.teacher_student ts
    where ts.teacher_id = auth.uid()
      and ts.student_id = profiles.id
      and ts.status = 'active'
  )
);
