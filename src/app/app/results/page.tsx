import { getStudentAttempts } from "@/lib/student";

export default async function ResultsPage() {
  const attempts = await getStudentAttempts();

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <span className="eyebrow">Results</span>
      <h1 style={{ fontSize: "clamp(42px,6vw,70px)", lineHeight: .95, letterSpacing: "-.06em", margin: "18px 0 10px" }}>See the work.</h1>
      <p style={{ color: "var(--muted)", maxWidth: 650 }}>Only your own attempts are shown. Scores are read from the authoritative server record.</p>
      <div style={{ marginTop: 38 }}>
        {attempts.map((attempt) => {
          const test = Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests;
          const percent = attempt.score !== null && attempt.max_score ? Math.round(Number(attempt.score) / Number(attempt.max_score) * 100) : null;
          return (
            <article key={attempt.id} style={{ borderTop: "1px solid var(--line)", padding: "20px 0", display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: 20 }}>{test?.title ?? "Assessment"}</h2><p style={{ color: "var(--muted)", margin: "6px 0 0", fontSize: 13 }}>{attempt.status}{attempt.submitted_at ? ` · submitted ${new Date(attempt.submitted_at).toLocaleDateString()}` : ""}</p></div>
              <strong style={{ fontSize: 24, letterSpacing: "-.04em" }}>{percent === null ? "Pending" : `${percent}%`}</strong>
            </article>
          );
        })}
        {!attempts.length && <div style={{ borderTop: "1px solid var(--line)", padding: "28px 0", color: "var(--muted)" }}>Your completed assessments will appear here.</div>}
      </div>
    </main>
  );
}
