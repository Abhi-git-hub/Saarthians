import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

// Assessment detail is read-only for students: tests happen offline, scores
// are recorded by the teacher. No answering happens here.
export default async function TestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["student"]);
  const supabase = await createClient();
  const { data: test, error } = await supabase
    .from("tests")
    .select("id,title,instructions,status")
    .eq("id", id)
    .eq("status", "published")
    .single();
  if (error || !test) notFound();

  const { data: attempt } = await supabase
    .from("test_attempts")
    .select("score,max_score,submitted_at")
    .eq("test_id", id)
    .eq("student_id", user.id)
    .neq("status", "in_progress")
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const scored = attempt && attempt.score !== null && attempt.max_score !== null;

  return (
    <main className="container" style={{ padding: "48px 0 80px", maxWidth: 960 }}>
      <Link href="/app/tests" style={{ color: "var(--muted)", fontSize: 13 }}>← Back to tests</Link>
      <span className="eyebrow" style={{ display: "flex", marginTop: 30 }}>Assessment</span>
      <h1 style={{ fontSize: "clamp(42px,6vw,70px)", lineHeight: .95, letterSpacing: "-.06em", margin: "16px 0 12px" }}>{test.title}</h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.65, maxWidth: 700 }}>{test.instructions || "Class test conducted offline."}</p>
      <div style={{ marginTop: 30, border: "1px solid var(--line)", borderRadius: 22, padding: 26, background: "white" }}>
        {scored ? (
          <>
            <span className="eyebrow">Your score</span>
            <p style={{ fontSize: 52, margin: "12px 0 6px", fontWeight: 850, letterSpacing: "-.04em" }}>
              {Number(attempt.score)} <span style={{ fontSize: 22, color: "var(--muted)" }}>/ {Number(attempt.max_score)}</span>
            </p>
            <Link href="/app/results" style={{ color: "var(--accent)", fontSize: 14, fontWeight: 700 }}>See all results →</Link>
          </>
        ) : (
          <>
            <span className="eyebrow">Score pending</span>
            <p style={{ color: "var(--muted)", lineHeight: 1.65, margin: "12px 0 0" }}>
              Your teacher hasn&apos;t recorded a score for this test yet. Scores appear here after class tests are checked.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
