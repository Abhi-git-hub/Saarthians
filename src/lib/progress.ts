import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export type ProgressSignal = {
  testId: string;
  title: string;
  attempts: number;
  latestPercent: number | null;
  bestPercent: number | null;
  missedQuestions: number;
};

export async function getStudentProgressSignals(): Promise<ProgressSignal[]> {
  const user = await requireRole(["student"]);
  const supabase = await createClient();

  const { data: attempts, error } = await supabase
    .from("test_attempts")
    .select("id,test_id,score,max_score,status,submitted_at,tests(title),test_answers(awarded_points,feedback)")
    .eq("student_id", user.id)
    .order("submitted_at", { ascending: false, nullsFirst: false });

  if (error) throw new Error("PROGRESS_LOAD_FAILED");

  const byTest = new Map<string, ProgressSignal>();
  for (const attempt of attempts) {
    const test = Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests;
    if (!test?.title) continue;
    const percent = attempt.score !== null && attempt.max_score ? Math.round(Number(attempt.score) / Number(attempt.max_score) * 100) : null;
    const missedQuestions = (attempt.test_answers ?? []).filter((answer) => answer.awarded_points !== null && Number(answer.awarded_points) === 0).length;
    const existing = byTest.get(attempt.test_id);
    if (!existing) {
      byTest.set(attempt.test_id, {
        testId: attempt.test_id,
        title: test.title,
        attempts: 1,
        latestPercent: percent,
        bestPercent: percent,
        missedQuestions,
      });
    } else {
      existing.attempts += 1;
      if (percent !== null) existing.bestPercent = existing.bestPercent === null ? percent : Math.max(existing.bestPercent, percent);
    }
  }

  return [...byTest.values()];
}
