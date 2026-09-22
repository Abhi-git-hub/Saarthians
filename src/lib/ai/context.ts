import { createClient } from "@/lib/supabase/server";
import type { GradedMistake, NoteSnippet, ProgressSummary, TutorContext } from "./types";

// Context selection: assemble ONLY the requesting student's own authorized
// records. Every query is scoped by the session user id passed in by the
// caller (never by client input), and RLS enforces the same boundary.
export async function selectTutorContext(userId: string, topicKeywords: string[] = []): Promise<TutorContext> {
  const supabase = await createClient();

  const { data: attempts, error: attemptsError } = await supabase
    .from("test_attempts")
    .select("id,test_id,status,score,max_score,submitted_at,tests(title),test_answers(question_id,answer_json,awarded_points,feedback,test_questions(id,prompt,points,test_question_keys(correct_answer_json)))")
    .eq("student_id", userId)
    .in("status", ["graded", "reviewed"])
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(20);

  if (attemptsError) throw new Error("TUTOR_CONTEXT_FAILED");

  const mistakes: GradedMistake[] = [];
  for (const attempt of attempts ?? []) {
    const test = Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests;
    for (const answer of attempt.test_answers ?? []) {
      if (answer.awarded_points === null || Number(answer.awarded_points) > 0) continue;
      const question = Array.isArray(answer.test_questions) ? answer.test_questions[0] : answer.test_questions;
      if (!question) continue;
      const keys = question.test_question_keys as
        | { correct_answer_json?: unknown }
        | Array<{ correct_answer_json?: unknown }>
        | null
        | undefined;
      const keyRow = Array.isArray(keys) ? keys[0] : keys;
      const correctRaw = keyRow?.correct_answer_json;
      mistakes.push({
        testId: attempt.test_id,
        testTitle: test?.title ?? "Assessment",
        questionId: answer.question_id,
        prompt: question.prompt,
        points: Number(question.points ?? 0),
        studentAnswer: typeof answer.answer_json === "string" ? answer.answer_json : JSON.stringify(answer.answer_json ?? ""),
        correctAnswer: typeof correctRaw === "string" ? correctRaw : JSON.stringify(correctRaw ?? ""),
        feedback: answer.feedback,
        submittedAt: attempt.submitted_at,
      });
      if (mistakes.length >= 12) break;
    }
    if (mistakes.length >= 12) break;
  }

  let notesQuery = supabase
    .from("notes")
    .select("id,title,content,updated_at")
    .eq("owner_user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  const { data: notes, error: notesError } = await notesQuery;
  if (notesError) throw new Error("TUTOR_CONTEXT_FAILED");

  const owned = notes ?? [];
  let snippets: NoteSnippet[] = owned.map((note) => ({
    id: note.id,
    title: note.title,
    excerpt: note.content.slice(0, 280),
    updatedAt: note.updated_at,
  }));

  if (topicKeywords.length > 0) {
    const lowered = topicKeywords.map((keyword) => keyword.toLowerCase());
    const matched = snippets.filter((snippet) =>
      lowered.some(
        (keyword) =>
          keyword.length > 2 &&
          (snippet.title.toLowerCase().includes(keyword) || snippet.excerpt.toLowerCase().includes(keyword)),
      ),
    );
    if (matched.length > 0) snippets = matched.slice(0, 5);
    else snippets = snippets.slice(0, 3);
  } else {
    snippets = snippets.slice(0, 5);
  }

  const graded = (attempts ?? []).filter((attempt) => attempt.score !== null && attempt.max_score !== null);
  const percents = graded.map((attempt) => (Number(attempt.score) / Math.max(Number(attempt.max_score), 1)) * 100);
  const byTest = new Map<string, { title: string; attempts: number; latest: number | null; best: number | null }>();
  for (const attempt of attempts ?? []) {
    const test = Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests;
    if (!test?.title) continue;
    const percent =
      attempt.score !== null && attempt.max_score
        ? Math.round((Number(attempt.score) / Number(attempt.max_score)) * 100)
        : null;
    const existing = byTest.get(attempt.test_id);
    if (!existing) {
      byTest.set(attempt.test_id, { title: test.title, attempts: 1, latest: percent, best: percent });
    } else {
      existing.attempts += 1;
      if (percent !== null) existing.best = existing.best === null ? percent : Math.max(existing.best, percent);
    }
  }

  const progress: ProgressSummary = {
    gradedAttempts: graded.length,
    averagePercent: percents.length ? Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length) : null,
    bestPercent: percents.length ? Math.round(Math.max(...percents)) : null,
    perTest: [...byTest.entries()].map(([testId, row]) => ({
      testId,
      title: row.title,
      attempts: row.attempts,
      latestPercent: row.latest,
      bestPercent: row.best,
    })),
  };

  return { mistakes, notes: snippets, progress, noteCount: owned.length };
}
