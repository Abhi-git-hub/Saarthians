import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeacherStudents } from "@/lib/teacher";
import { Scorebook } from "./scorebook";

export default async function TestScoresPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["teacher", "admin"]);
  const supabase = await createClient();

  const { data: test } = await supabase
    .from("tests")
    .select("id,title,status,max_marks")
    .eq("id", id)
    .single();
  // Ownership: teachers see only their own tests (admins bypass).
  const { data: owned } = await supabase.from("tests").select("id").eq("id", id).eq("teacher_id", user.id).single();
  const isAdmin = user.role === "admin";
  if (!test || (!owned && !isAdmin)) notFound();

  const students = user.role === "admin"
    ? []
    : await getTeacherStudents(user.id).catch(() => []);
  const { data: attempts } = await supabase
    .from("test_attempts")
    .select("student_id,score,max_score,submitted_at")
    .eq("test_id", id)
    .neq("status", "in_progress")
    .order("submitted_at", { ascending: false });

  const recorded = new Map<string, { score: number | null; max: number | null; at: string | null }>();
  for (const attempt of attempts ?? []) {
    if (!recorded.has(attempt.student_id)) {
      recorded.set(attempt.student_id, {
        score: attempt.score === null ? null : Number(attempt.score),
        max: attempt.max_score === null ? null : Number(attempt.max_score),
        at: attempt.submitted_at,
      });
    }
  }

  const roster = students.map((s) => {
    const profile = Array.isArray(s.profiles) ? s.profiles[0] : (s as { profiles?: { display_name?: string } }).profiles;
    return {
      studentId: s.student_id,
      displayName: profile?.display_name ?? "Unnamed student",
      recorded: recorded.get(s.student_id) ?? null,
    };
  });

  return (
    <main className="container" style={{ padding: "46px 0 80px", maxWidth: 900 }}>
      <Link href="/teacher/tests" style={{ color: "var(--muted)", fontSize: 13 }}>← Assessments</Link>
      <span className="eyebrow" style={{ display: "flex", marginTop: 28 }}>Scorebook · {test.status}</span>
      <h1 style={{ fontSize: "clamp(36px,5vw,58px)", lineHeight: 1, letterSpacing: "-.05em", margin: "16px 0 10px" }}>{test.title}</h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.65, maxWidth: 700 }}>
        Scores from your offline class test. Enter each student&apos;s marks — saving overwrites that
        student&apos;s previous record for this test. Students see their score in Results immediately.
      </p>
      {user.role === "admin" ? (
        <p style={{ color: "var(--muted)" }}>Admins record scores from the teacher workspace with an assigned roster.</p>
      ) : (
        <Scorebook
          testId={test.id}
          maxMarks={test.max_marks === null ? null : Number(test.max_marks)}
          roster={roster}
        />
      )}
    </main>
  );
}
