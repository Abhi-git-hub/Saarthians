import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getTeacherResults, getTeacherStudents, getTeacherTests } from "@/lib/teacher";

export default async function TeacherWorkspace() {
  const user = await requireRole(["teacher", "admin"]);
  const [students, tests, results] = await Promise.all([
    getTeacherStudents(user.id),
    getTeacherTests(user.id),
    getTeacherResults(user.id),
  ]);

  return (
    <main className="container" style={{ padding: "56px 0 80px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow">Teacher workspace</span>
          <h1 style={{ fontSize: "clamp(44px,7vw,78px)", lineHeight: .94, letterSpacing: "-.06em", margin: "18px 0 12px" }}>Teach with visibility.</h1>
          <p style={{ color: "var(--muted)", maxWidth: 640, lineHeight: 1.7, margin: 0 }}>A focused operating surface for your learners, assessments and results.</p>
        </div>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>{user.email ?? "teacher"}</span>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12, marginTop: 42 }}>
        {[['Students', students.length, '/teacher/students'], ['Tests', tests.length, '/teacher/tests'], ['Graded results', results.length, '/teacher/results']].map(([label, value, href]) => (
          <Link key={String(label)} href={String(href)} style={{ border: "1px solid var(--line)", borderRadius: 20, padding: 22, background: "white" }}>
            <span className="eyebrow">Overview</span>
            <strong style={{ display: "block", fontSize: 34, marginTop: 12 }}>{value}</strong>
            <span style={{ display: "block", marginTop: 5, color: "var(--muted)", fontSize: 14 }}>{label} →</span>
          </Link>
        ))}
      </section>

      <section style={{ marginTop: 44, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <article style={{ border: "1px solid var(--line)", borderRadius: 22, padding: 26, background: "white" }}>
          <span className="eyebrow">Learners</span>
          <h2 style={{ fontSize: 28, letterSpacing: "-.04em", margin: "14px 0 8px" }}>Know who needs attention.</h2>
          <p style={{ color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>Open the roster to work only with students assigned to your account.</p>
          <Link href="/teacher/students" style={{ display: "inline-block", marginTop: 20, fontWeight: 750 }}>Open roster →</Link>
        </article>
        <article style={{ border: "1px solid var(--line)", borderRadius: 22, padding: 26, background: "white" }}>
          <span className="eyebrow">Assessment</span>
          <h2 style={{ fontSize: 28, letterSpacing: "-.04em", margin: "14px 0 8px" }}>Build and review.</h2>
          <p style={{ color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>Create tests, publish them deliberately, then review server-graded outcomes.</p>
          <Link href="/teacher/tests" style={{ display: "inline-block", marginTop: 20, fontWeight: 750 }}>Open assessments →</Link>
        </article>
      </section>
    </main>
  );
}
