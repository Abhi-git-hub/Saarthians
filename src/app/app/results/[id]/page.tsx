import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export default async function ResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["student"]);
  const supabase = await createClient();

  const { data: attempt, error } = await supabase
    .from("test_attempts")
    .select("id,test_id,status,score,max_score,submitted_at,tests(title,instructions),test_answers(id,question_id,answer_json,awarded_points,feedback,test_questions(id,prompt,points,correct_answer_json,type,options_json))")
    .eq("id", id)
    .eq("student_id", user.id)
    .single();

  if (error || !attempt) notFound();

  const test = Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests;
  const percent = attempt.score !== null && attempt.max_score ? Math.round(Number(attempt.score) / Number(attempt.max_score) * 100) : null;
  const answers = [...(attempt.test_answers ?? [])].sort((a, b) => {
    const qa = Array.isArray(a.test_questions) ? a.test_questions[0] : a.test_questions;
    const qb = Array.isArray(b.test_questions) ? b.test_questions[0] : b.test_questions;
    return (qa?.id ?? "").localeCompare(qb?.id ?? "");
  });

  return (
    <main className="container" style={{ padding: "48px 0 80px", maxWidth: 960 }}>
      <Link href="/app/results" style={{ color: "var(--muted)", fontSize: 13 }}>← Back to results</Link>
      <span className="eyebrow" style={{ display: "flex", marginTop: 30 }}>Result review</span>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 20, flexWrap: "wrap", marginTop: 16 }}>
        <div>
          <h1 style={{ fontSize: "clamp(42px,6vw,70px)", lineHeight: .95, letterSpacing: "-.06em", margin: 0 }}>{test?.title ?? "Assessment"}</h1>
          <p style={{ color: "var(--muted)", margin: "12px 0 0" }}>{attempt.submitted_at ? `Submitted ${new Date(attempt.submitted_at).toLocaleString()}` : "Not submitted"}</p>
        </div>
        <div style={{ textAlign: "right" }}><strong style={{ display: "block", fontSize: 48, letterSpacing: "-.06em" }}>{percent === null ? "—" : `${percent}%`}</strong><span style={{ color: "var(--muted)", fontSize: 13 }}>{attempt.score ?? 0} / {attempt.max_score ?? 0} points</span></div>
      </div>

      <section style={{ marginTop: 34, display: "grid", gap: 14 }}>
        {answers.map((answer, index) => {
          const question = Array.isArray(answer.test_questions) ? answer.test_questions[0] : answer.test_questions;
          const isCorrect = answer.awarded_points !== null && Number(answer.awarded_points) === Number(question?.points ?? -1);
          const answerValue = typeof answer.answer_json === "string" ? answer.answer_json : JSON.stringify(answer.answer_json ?? "");
          const correctValue = typeof question?.correct_answer_json === "string" ? question.correct_answer_json : JSON.stringify(question?.correct_answer_json ?? "");
          return (
            <article key={answer.id} style={{ border: "1px solid var(--line)", borderRadius: 20, padding: 24, background: "white" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                <span className="eyebrow">Question {index + 1} · {question?.points ?? 0} pts</span>
                <span style={{ fontWeight: 800, fontSize: 13 }}>{isCorrect ? "Correct" : "Needs review"}</span>
              </div>
              <h2 style={{ fontSize: 20, lineHeight: 1.45, margin: "14px 0" }}>{question?.prompt ?? "Question unavailable"}</h2>
              <div style={{ display: "grid", gap: 8, color: "var(--muted)", fontSize: 14 }}><div><strong style={{ color: "var(--ink)" }}>Your answer:</strong> {answerValue}</div>{!isCorrect && <div><strong style={{ color: "var(--ink)" }}>Expected answer:</strong> {correctValue}</div>}{answer.feedback && <div style={{ marginTop: 6, padding: 12, borderRadius: 12, background: "#eef2ec" }}>{answer.feedback}</div>}</div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
