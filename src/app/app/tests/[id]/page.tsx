import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export default async function TestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole(["student"]);
  const supabase = await createClient();
  const { data: test, error } = await supabase
    .from("tests")
    .select("id,title,instructions,duration_seconds,published_at,test_questions(id,type,prompt,options_json,points,position)")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (error || !test) notFound();

  const questions = [...(test.test_questions ?? [])].sort((a, b) => a.position - b.position);

  return (
    <main className="container" style={{ padding: "48px 0 80px", maxWidth: 900 }}>
      <Link href="/app/tests" style={{ color: "var(--muted)", fontSize: 13 }}>← Back to tests</Link>
      <span className="eyebrow" style={{ display: "flex", marginTop: 30 }}>Assessment</span>
      <h1 style={{ fontSize: "clamp(42px,6vw,70px)", lineHeight: .95, letterSpacing: "-.06em", margin: "16px 0 12px" }}>{test.title}</h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.65, maxWidth: 700 }}>{test.instructions || "Read each question carefully and submit when you are done."}</p>
      <div style={{ marginTop: 34, padding: 20, border: "1px solid var(--line)", borderRadius: 18, background: "white" }}>
        <strong>{questions.length} question{questions.length === 1 ? "" : "s"}</strong>
        {test.duration_seconds ? <span style={{ color: "var(--muted)", marginLeft: 12 }}>{Math.ceil(test.duration_seconds / 60)} minutes</span> : null}
      </div>
      <section style={{ marginTop: 36, display: "grid", gap: 14 }}>
        {questions.map((question, index) => (
          <article key={question.id} style={{ border: "1px solid var(--line)", borderRadius: 20, padding: 24, background: "white" }}>
            <span className="eyebrow">Question {index + 1} · {question.points} pts</span>
            <h2 style={{ fontSize: 20, lineHeight: 1.4, margin: "14px 0 0" }}>{question.prompt}</h2>
          </article>
        ))}
      </section>
      <div style={{ marginTop: 28, padding: 18, borderRadius: 16, background: "#eef2ec", color: "var(--muted)", lineHeight: 1.6, fontSize: 14 }}>
        Attempt submission is intentionally gated until the server-side grading workflow is enabled. Your browser will never be trusted to calculate or persist a score.
      </div>
    </main>
  );
}
