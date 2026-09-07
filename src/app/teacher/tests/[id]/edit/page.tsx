import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { TestEditor } from "@/components/teacher/test-editor";

export default async function TeacherTestEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["teacher", "admin"]);
  const supabase = await createClient();
  const { data: test } = await supabase
    .from("tests")
    .select("id,title,instructions,duration_seconds,status,teacher_id,test_questions(id,type,prompt,options_json,correct_answer_json,points,position)")
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
      <TestEditor testId={test.id} initialQuestions={questions.map((q) => ({ ...q, options_json: q.options_json as unknown, correct_answer_json: q.correct_answer_json as unknown }))} status={test.status} />
    </main>
  );
}
