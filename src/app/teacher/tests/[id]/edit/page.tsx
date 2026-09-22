import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { TestEditor } from "@/components/teacher/test-editor";
import { LiveSettings } from "@/components/teacher/live-settings";

// Answer keys live in test_question_keys (teacher/admin/review-only RLS).
// This join resolves to null for anyone else, never to a key leak.
function keyOf(q: { test_question_keys?: unknown }): unknown {
  const nested = q.test_question_keys as { correct_answer_json?: unknown } | Array<{ correct_answer_json?: unknown }> | null | undefined;
  const row = Array.isArray(nested) ? nested[0] : nested;
  return row?.correct_answer_json ?? null;
}

export default async function TeacherTestEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["teacher", "admin"]);
  const supabase = await createClient();
  const { data: test } = await supabase
    .from("tests")
    .select("id,title,instructions,duration_seconds,status,start_time,end_time,assessment_pdf_path,teacher_id,test_questions(id,type,prompt,options_json,points,position,test_question_keys(correct_answer_json))")
    .eq("id", id)
    .single();

  if (!test || (test.teacher_id !== user.id && user.role !== "admin")) notFound();

  const questions = [...(test.test_questions ?? [])].sort((a, b) => a.position - b.position);

  return (
    <main className="container" style={{ padding: "46px 0 80px", maxWidth: 1000 }}>
      <Link href="/teacher/tests" style={{ color: "var(--muted)", fontSize: 13 }}>← Assessments</Link>
      <span className="eyebrow" style={{ display: "flex", marginTop: 28 }}>Authoring · {test.status}</span>
      <h1 style={{ fontSize: "clamp(42px,6vw,72px)", lineHeight: .95, letterSpacing: "-.06em", margin: "16px 0 10px" }}>{test.title}</h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.65, maxWidth: 720 }}>{test.instructions || "Build a focused assessment. Keep questions clear, answer keys deliberate, and points proportional to difficulty."}</p>
      <ol className="builder-steps" aria-label="Assessment builder steps">
        <li><a href="#builder-questions"><b>1</b> Questions</a></li>
        <li><a href="#builder-schedule"><b>2</b> Schedule</a></li>
        <li><a href="#builder-review"><b>3</b> Review & publish</a></li>
      </ol>
      <div id="builder-questions">
        <TestEditor testId={test.id} initialQuestions={questions.map((q) => ({ ...q, options_json: q.options_json as unknown, correct_answer_json: keyOf(q) }))} status={test.status} />
      </div>
      <div id="builder-schedule">
        <LiveSettings testId={test.id} initialStart={test.start_time} initialEnd={test.end_time} initialAssessment={test.assessment_pdf_path} />
      </div>
      <section id="builder-review" className="builder-review">
        <span className="eyebrow">Review & publish</span>
        <dl>
          <div><dt>Status</dt><dd>{test.status}</dd></div>
          <div><dt>Questions</dt><dd>{questions.length}</dd></div>
          <div><dt>Window</dt><dd>{test.start_time ? new Date(test.start_time).toLocaleString("en-IN") : "open-ended"} → {test.end_time ? new Date(test.end_time).toLocaleString("en-IN") : "open"}</dd></div>
        </dl>
        <p>Publishing happens from the question editor above once at least one question exists. Published tests lock their questions — the window stays editable.</p>
      </section>
    </main>
  );
}
