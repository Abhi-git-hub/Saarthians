import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getTeacherStudents } from "@/lib/teacher";

export default async function TeacherStudentsPage() {
  const user = await requireRole(["teacher", "admin"]);
  const students = await getTeacherStudents(user.id);

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <Link href="/teacher" style={{ color: "var(--muted)", fontSize: 13 }}>← Teacher workspace</Link>
      <span className="eyebrow" style={{ display: "flex", marginTop: 28 }}>Students</span>
      <h1 style={{ fontSize: "clamp(40px,6vw,68px)", lineHeight: .95, letterSpacing: "-.06em", margin: "16px 0 12px" }}>Your learners.</h1>
      <p style={{ color: "var(--muted)", maxWidth: 620, lineHeight: 1.7 }}>Only active student relationships attached to your teacher account are shown here.</p>

      {students.length === 0 ? (
        <section style={{ marginTop: 36, border: "1px solid var(--line)", borderRadius: 20, padding: 28, background: "white" }}>
          <span className="eyebrow">No learners yet</span>
          <h2 style={{ margin: "12px 0 8px", fontSize: 24 }}>Your student roster is empty.</h2>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.65 }}>Student-teacher assignment will be added through the controlled onboarding flow rather than a client-editable role field.</p>
        </section>
      ) : (
        <section style={{ marginTop: 36, display: "grid", gap: 12 }}>
          {students.map((row) => {
            const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
            return (
              <article key={row.student_id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "center", border: "1px solid var(--line)", borderRadius: 18, padding: 22, background: "white" }}>
                <div>
                  <strong style={{ fontSize: 18 }}>{profile?.display_name || "Unnamed student"}</strong>
                  <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 5 }}>{profile?.status || "active"}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 750, textTransform: "uppercase", letterSpacing: ".08em" }}>Active</span>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
