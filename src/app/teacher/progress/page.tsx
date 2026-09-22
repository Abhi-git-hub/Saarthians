import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getTeacherProgressOverview } from "@/lib/teacher";

export default async function TeacherProgressPage() {
  const user = await requireRole(["teacher", "admin"]);
  const overview = await getTeacherProgressOverview(user.id);

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <Link href="/teacher" style={{ color: "var(--muted)", fontSize: 13 }}>← Teacher workspace</Link>
      <div style={{ marginTop: 24 }}>
        <span className="eyebrow">Progress</span>
        <h1 style={{ fontSize: "clamp(40px,6vw,68px)", lineHeight: .95, letterSpacing: "-.06em", margin: "16px 0 12px" }}>The class, at a glance.</h1>
        <p style={{ color: "var(--muted)", maxWidth: 620, lineHeight: 1.7, margin: 0 }}>Built only from graded work by your assigned students. Small datasets are shown as-is — no invented trends.</p>
      </div>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginTop: 34 }}>
        {[["Assigned students", String(overview.studentCount)], ["Your tests", String(overview.testCount)], ["Assessments tracked", String(overview.byTest.length)]].map(([label, value]) => (
          <article key={label} style={cardStyle}><span className="eyebrow">{label}</span><strong style={{ display: "block", marginTop: 12, fontSize: 32, letterSpacing: "-.05em" }}>{value}</strong></article>
        ))}
      </section>
      <section style={{ marginTop: 46 }}>
        <span className="eyebrow">By assessment</span>
        <h2 style={{ fontSize: 27, letterSpacing: "-.04em", margin: "10px 0 20px" }}>Where the class stands.</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {overview.byTest.map((row) => (
            <article key={row.title} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                <div><h3 style={{ margin: 0, fontSize: 19 }}>{row.title}</h3><p style={{ color: "var(--muted)", margin: "6px 0 0", fontSize: 13 }}>{row.attempts} graded attempt{row.attempts === 1 ? "" : "s"}</p></div>
                <div style={{ textAlign: "right" }}><strong style={{ display: "block", fontSize: 25 }}>{row.latest === null ? "—" : `${row.latest}%`}</strong><span style={{ color: "var(--muted)", fontSize: 12 }}>latest · best {row.best === null ? "—" : `${row.best}%`}</span></div>
              </div>
              <div style={{ height: 8, background: "var(--paper)", borderRadius: 999, marginTop: 16, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(Math.max(row.best ?? 0, 0), 100)}%`, background: "var(--accent)", borderRadius: 999 }} /></div>
            </article>
          ))}
          {!overview.byTest.length && <div style={{ ...cardStyle, color: "var(--muted)" }}>No graded work yet. Once students submit your assessments, class-level signals appear here.</div>}
        </div>
      </section>
    </main>
  );
}

const cardStyle = { border: "1px solid var(--line)", borderRadius: 20, padding: 22, background: "white" };
