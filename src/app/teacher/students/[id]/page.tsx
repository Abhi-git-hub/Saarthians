import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getTeacherStudentDetail } from "@/lib/teacher";

export default async function TeacherStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["teacher", "admin"]);

  let detail: Awaited<ReturnType<typeof getTeacherStudentDetail>>;
  try {
    detail = await getTeacherStudentDetail(user.id, id);
  } catch {
    notFound();
  }

  const graded = detail.attempts.filter((attempt) => attempt.score !== null && attempt.max_score !== null);
  const average = graded.length
    ? Math.round(graded.reduce((sum, attempt) => sum + (Number(attempt.score) / Math.max(Number(attempt.max_score), 1)) * 100, 0) / graded.length)
    : null;

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <Link href="/teacher/students" style={{ color: "var(--muted)", fontSize: 13 }}>← Roster</Link>
      <div style={{ marginTop: 24 }}>
        <span className="eyebrow">Learner</span>
        <h1 style={{ fontSize: "clamp(40px,6vw,68px)", lineHeight: .95, letterSpacing: "-.06em", margin: "16px 0 12px" }}>{detail.profile.display_name || "Assigned learner"}</h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>Assigned since {new Date(detail.link.created_at).toLocaleDateString()} · {detail.profile.status}</p>
      </div>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginTop: 34 }}>
        {[["Graded attempts", String(graded.length)], ["Average", average === null ? "—" : `${average}%`], ["Total attempts", String(detail.attempts.length)]].map(([label, value]) => (
          <article key={label} style={cardStyle}><span className="eyebrow">{label}</span><strong style={{ display: "block", marginTop: 12, fontSize: 32, letterSpacing: "-.05em" }}>{value}</strong></article>
        ))}
      </section>
      <section style={{ marginTop: 46 }}>
        <span className="eyebrow">Attempt history</span>
        <h2 style={{ fontSize: 27, letterSpacing: "-.04em", margin: "10px 0 20px" }}>How practice is going.</h2>
        <div style={{ display: "grid", gap: 0 }}>
          {detail.attempts.map((attempt) => {
            const test = Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests;
            const percent = attempt.score !== null && attempt.max_score ? Math.round((Number(attempt.score) / Number(attempt.max_score)) * 100) : null;
            return (
              <article key={attempt.id} style={{ borderTop: "1px solid var(--line)", padding: "18px 0", display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center" }}>
                <div><strong>{test?.title ?? "Assessment"}</strong><p style={{ color: "var(--muted)", margin: "5px 0 0", fontSize: 13 }}>{attempt.status}{attempt.submitted_at ? ` · ${new Date(attempt.submitted_at).toLocaleDateString()}` : ""}</p></div>
                <strong style={{ fontSize: 22 }}>{percent === null ? "—" : `${percent}%`}</strong>
              </article>
            );
          })}
          {!detail.attempts.length && <div style={{ borderTop: "1px solid var(--line)", padding: "24px 0", color: "var(--muted)" }}>No attempts on your assessments yet.</div>}
        </div>
      </section>
      <section style={{ marginTop: 46 }}>
        <span className="eyebrow">Your material</span>
        <h2 style={{ fontSize: 27, letterSpacing: "-.04em", margin: "10px 0 20px" }}>Recently written for them.</h2>
        <div style={{ display: "grid", gap: 0 }}>
          {detail.notes.map((note) => (
            <Link href={`/teacher/notes/${note.id}`} key={note.id} style={{ borderTop: "1px solid var(--line)", padding: "16px 0", fontSize: 18, fontWeight: 750 }}>{note.title}</Link>
          ))}
          {!detail.notes.length && <div style={{ borderTop: "1px solid var(--line)", padding: "24px 0", color: "var(--muted)" }}>No material yet. <Link href="/teacher/notes/new" style={{ textDecoration: "underline" }}>Write the first one</Link>.</div>}
        </div>
      </section>
    </main>
  );
}

const cardStyle = { border: "1px solid var(--line)", borderRadius: 20, padding: 22, background: "white" };
