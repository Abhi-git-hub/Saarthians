import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getTeacherStudents } from "@/lib/teacher";
import { RecordMarksForm } from "./record-marks-form";

export default async function RecordMarksPage() {
  const user = await requireRole(["teacher", "admin"]);
  const students =
    user.role === "admin" ? [] : await getTeacherStudents(user.id).catch(() => []);

  const roster = students.map((s) => {
    const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
    return {
      studentId: s.student_id,
      displayName: profile?.display_name ?? "Unnamed student",
      gradeLevel: (profile as { grade_level?: string | null } | undefined)?.grade_level ?? null,
    };
  });

  return (
    <main className="container" style={{ padding: "46px 0 80px", maxWidth: 760 }}>
      <Link href="/teacher/settings" style={{ color: "var(--muted)", fontSize: 13 }}>Account settings →</Link>
      <span className="eyebrow" style={{ display: "flex", marginTop: 28 }}>Record marks</span>
      <h1 style={{ fontSize: "clamp(36px,5vw,56px)", lineHeight: 1, letterSpacing: "-.05em", margin: "16px 0 10px" }}>
        Whose marks, which subject?
      </h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.65, maxWidth: 640 }}>
        Pick a student, type the subject and marks from your class test. It lands on their dashboard
        immediately — correcting is just entering again.
      </p>
      {user.role === "admin" ? (
        <p style={{ color: "var(--muted)" }}>Admins record scores from a teacher workspace with an assigned roster.</p>
      ) : (
        <RecordMarksForm roster={roster} />
      )}
    </main>
  );
}
