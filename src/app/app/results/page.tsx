import Link from "next/link";
import { getStudentAttempts } from "@/lib/student";

export default async function ResultsPage() {
  const attempts = await getStudentAttempts();
  const graded = attempts.filter((attempt) => attempt.score !== null && attempt.max_score !== null);
  const average = graded.length ? Math.round(graded.reduce((sum, attempt) => sum + Number(attempt.score) / Math.max(Number(attempt.max_score), 1) * 100, 0) / graded.length) : 0;
  const best = graded.length ? Math.round(Math.max(...graded.map((attempt) => Number(attempt.score) / Math.max(Number(attempt.max_score), 1) * 100))) : 0;

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <span className="eyebrow">Results</span>
      <h1 style={{ fontSize: "clamp(42px,6vw,70px)", lineHeight: .95, letterSpacing: "-.06em", margin: "18px 0 10px" }}>See the work.</h1>
      <p style={{ color: "var(--muted)", maxWidth: 650, lineHeight: 1.65 }}>Your assessment history, with the detail behind every score.</p>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginTop: 34 }}>
        {[["Graded", graded.length], ["Average", `${average}%`], ["Best", `${best}%`]].map(([label, value]) => (
          <article key={label} style={cardStyle}><span className="eyebrow">{label}</span><strong style={{ display: "block", marginTop: 12, fontSize: 32, letterSpacing: "-.05em" }}>{value}</strong></article>
        ))}
      </section>

      <section style={{ marginTop: 46 }}>
        {attempts.map((attempt) => {
          const test = Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests;
          const percent = attempt.score !== null && attempt.max_score ? Math.round(Number(attempt.score) / Number(attempt.max_score) * 100) : null;
          return (
            <article key={attempt.id} style={{ borderTop: "1px solid var(--line)", padding: "20px 0", display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20 }}>{test?.title ?? "Assessment"}</h2>
                <p style={{ color: "var(--muted)", margin: "6px 0 0", fontSize: 13 }}>{attempt.status}{attempt.submitted_at ? ` · ${new Date(attempt.submitted_at).toLocaleDateString()}` : ""}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <strong style={{ display: "block", fontSize: 24, letterSpacing: "-.04em" }}>{percent === null ? "Pending" : `${percent}%`}</strong>
                {percent !== null && <Link href={`/app/results/${attempt.id}`} style={{ color: "var(--accent)", fontSize: 13, fontWeight: 700 }}>Review →</Link>}
              </div>
            </article>
          );
        })}
        {!attempts.length && <div style={{ borderTop: "1px solid var(--line)", padding: "28px 0", color: "var(--muted)" }}>Your completed assessments will appear here.</div>}
      </section>
    </main>
  );
}

const cardStyle = { border: "1px solid var(--line)", borderRadius: 20, padding: 22, background: "white" };
