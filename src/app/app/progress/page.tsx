import { getStudentAttempts, getStudentNotes, getStudentTests } from "@/lib/student";

export default async function ProgressPage() {
  const [attempts, notes, tests] = await Promise.all([getStudentAttempts(), getStudentNotes(), getStudentTests()]);
  const graded = attempts.filter((attempt) => attempt.score !== null && attempt.max_score !== null);
  const average = graded.length ? Math.round(graded.reduce((sum, attempt) => sum + Number(attempt.score) / Math.max(Number(attempt.max_score), 1) * 100, 0) / graded.length) : 0;
  const best = graded.length ? Math.max(...graded.map((attempt) => Number(attempt.score) / Math.max(Number(attempt.max_score), 1) * 100)) : 0;

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <span className="eyebrow">Progress</span>
      <h1 style={{ fontSize: "clamp(42px,6vw,70px)", lineHeight: .95, letterSpacing: "-.06em", margin: "18px 0 10px" }}>Make progress visible.</h1>
      <p style={{ color: "var(--muted)", maxWidth: 650 }}>This view intentionally uses only records attached to your account. As the assessment engine grows, this becomes the foundation for trends and recommendations.</p>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginTop: 40 }}>
        {[['Average score', `${average}%`], ['Best score', `${Math.round(best)}%`], ['Notes', String(notes.length)], ['Available tests', String(tests.length)]].map(([label, value]) => (
          <article key={label} style={{ background: "white", border: "1px solid var(--line)", borderRadius: 20, padding: 22 }}><span className="eyebrow">{label}</span><strong style={{ display: "block", fontSize: 31, marginTop: 13, letterSpacing: "-.05em" }}>{value}</strong></article>
        ))}
      </section>
      <section style={{ marginTop: 48, border: "1px solid var(--line)", borderRadius: 24, background: "white", padding: 26 }}>
        <span className="eyebrow">Assessment signal</span>
        <h2 style={{ margin: "10px 0", fontSize: 25, letterSpacing: "-.035em" }}>{graded.length ? `${graded.length} graded attempt${graded.length === 1 ? '' : 's'} recorded.` : "No graded attempts yet."}</h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>{graded.length ? "Keep reviewing the mistakes, not just the score. The next milestone will add question-level patterns and a guided revision plan." : "Complete an assessment once the server-side submission workflow is enabled. Scores will be calculated from the stored questions and answers."}</p>
      </section>
    </main>
  );
}
