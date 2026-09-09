import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getTeacherTests } from "@/lib/teacher";

export default async function TeacherTestsPage() {
  const user = await requireRole(["teacher", "admin"]);
  const tests = await getTeacherTests(user.id);

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <Link href="/teacher" style={{ color: "var(--muted)", fontSize: 13 }}>← Teacher workspace</Link>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "end", flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow" style={{ display: "flex", marginTop: 28 }}>Assessments</span>
          <h1 style={{ fontSize: "clamp(40px,6vw,68px)", lineHeight: .95, letterSpacing: "-.06em", margin: "16px 0 12px" }}>Build better tests.</h1>
          <p style={{ color: "var(--muted)", maxWidth: 620, lineHeight: 1.7 }}>Your tests, their publishing state, and question counts are scoped to your teacher account.</p>
        </div>
        <Link href="/teacher/tests/new" style={{ background: "var(--accent)", color: "white", padding: "13px 18px", borderRadius: 999, fontWeight: 700 }}>New assessment →</Link>
      </div>

      {tests.length === 0 ? (
        <section style={{ marginTop: 36, border: "1px solid var(--line)", borderRadius: 20, padding: 28, background: "white" }}>
          <span className="eyebrow">No assessments</span>
          <h2 style={{ margin: "12px 0 8px", fontSize: 24 }}>Create your first assessment.</h2>
          <p style={{ margin: "0 0 18px", color: "var(--muted)", lineHeight: 1.65 }}>Drafts stay private until you publish them to your assigned students.</p>
          <Link href="/teacher/tests/new" style={{ fontWeight: 750 }}>Create a draft →</Link>
        </section>
      ) : (
        <section style={{ marginTop: 36, display: "grid", gap: 12 }}>
          {tests.map((test) => (
            <article key={test.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "center", border: "1px solid var(--line)", borderRadius: 18, padding: 22, background: "white" }}>
              <div>
                <strong style={{ fontSize: 18 }}>{test.title}</strong>
                <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 5 }}>{test.test_questions?.length ?? 0} questions</div>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 750, textTransform: "uppercase", letterSpacing: ".08em" }}>{test.status}</span>
                {test.status === "draft"
                  ? <Link href={`/teacher/tests/${test.id}/edit`} style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>Edit →</Link>
                  : <Link href={`/teacher/tests/${test.id}/edit`} style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>Review →</Link>}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
