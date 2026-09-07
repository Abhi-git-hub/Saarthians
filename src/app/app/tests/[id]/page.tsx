import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { TestPlayer } from "./test-player";

export default async function TestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["student"]);
  const supabase = await createClient();

  const { data: test, error } = await supabase
    .from("tests")
    .select("id,title,instructions,duration_seconds,published_at,test_questions(id,type,prompt,options_json,points,position)")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (error || !test) notFound();

  const questions = [...(test.test_questions ?? [])].sort((a, b) => a.position - b.position);
  const { data: activeAttempt } = await supabase
    .from("test_attempts")
    .select("id,status,started_at,test_answers(question_id,answer_json)")
    .eq("test_id", id)
    .eq("student_id", user.id)
    .in("status", ["created", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const initialAnswers = Object.fromEntries(
    (activeAttempt?.test_answers ?? []).map((answer) => [answer.question_id, answer.answer_json]),
  );

  return (
    <main className="container" style={{ padding: "48px 0 80px", maxWidth: 960 }}>
      <Link href="/app/tests" style={{ color: "var(--muted)", fontSize: 13 }}>← Back to tests</Link>
      <span className="eyebrow" style={{ display: "flex", marginTop: 30 }}>Assessment</span>
      <h1 style={{ fontSize: "clamp(42px,6vw,70px)", lineHeight: .95, letterSpacing: "-.06em", margin: "16px 0 12px" }}>{test.title}</h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.65, maxWidth: 700 }}>{test.instructions || "Read each question carefully and submit when you are done."}</p>
      <div style={{ marginTop: 30, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <span style={metaStyle}>{questions.length} question{questions.length === 1 ? "" : "s"}</span>
        {test.duration_seconds ? <span style={metaStyle}>{Math.ceil(test.duration_seconds / 60)} minutes</span> : null}
        {activeAttempt ? <span style={{ ...metaStyle, background: "#eaf0e8" }}>Attempt in progress</span> : null}
      </div>
      <TestPlayer
        testId={test.id}
        durationSeconds={test.duration_seconds}
        questions={questions}
        initialAttemptId={activeAttempt?.id ?? null}
        initialStartedAt={activeAttempt?.started_at ?? null}
        initialAnswers={initialAnswers}
      />
    </main>
  );
}

const metaStyle = {
  display: "inline-flex",
  alignItems: "center",
  border: "1px solid var(--line)",
  borderRadius: 999,
  padding: "8px 12px",
  color: "var(--muted)",
  fontSize: 13,
};
