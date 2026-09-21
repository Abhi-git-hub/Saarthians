-- Query-path indexes for foreign-key / ownership lookups the app performs.
--
-- Both indexes follow obvious access paths already in the codebase; no query
-- was changed to justify them:
--   * test_questions_by_test lets the teacher editor, publish-count check,
--     and server-side grading join questions by their parent test without a
--     sequential scan. The FK test_questions(test_id) previously had no index.
--   * teacher_student_by_student covers the reverse direction of the
--     (teacher_id, student_id) primary key: student-side relationship checks
--     (RLS participant policy, attempt availability) filter on student_id.
-- Idempotent and backward-compatible (IF NOT EXISTS).

create index if not exists test_questions_by_test
  on public.test_questions (test_id);

create index if not exists teacher_student_by_student
  on public.teacher_student (student_id);
