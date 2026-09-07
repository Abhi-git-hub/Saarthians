import { getStudentAttempts, getStudentNotes, getStudentTests } from "@/lib/student";
import { getStudentProgressSignals } from "@/lib/progress";

export default async function ProgressPage() {
  const [attempts, notes, tests, signals] = await Promise.all([getStudentAttempts(), getStudentNotes(), getStudentTests(), getStudentProgressSignals()]);
  const graded = attempts.filter((attempt) => attempt.score !== null && attempt.max_score !== null);
  const average = graded.length ? Math.round(graded.reduce((sum, attempt) => sum + Number(attempt.score) / Math.max(Number(attempt.max_score), 1) * 100, 0) / graded.length) : 0;
  const best = graded.length ? Math.round(Math.max(...graded.map((attempt) => Number(attempt.score) / Math.max(Number(attempt.max_score), 1) * 100))) : 0;

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <span className="eyebrow">Progress</span>
      <h1 style={{ fontSize: "clamp(42px,6vw,70px)", lineHeight: .95, letterSpacing: "-.06em", margin: "18px 0 10px" }}>Make progress visible.</h1>
      <p style={{ color: "var(--muted)", maxWidth: 650, lineHeight: 1.65 }}>A learning signal built from your own assessment history—not from a generic leaderboard.</p>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginTop: 34 }}>
        {[["Average score", `${average}%`], ["Best score", `${best}%`], ["Graded attempts", String(graded.length)], ["Notes", String(notes.length)], ["Available tests", String(tests.length)]].map(([label, value]) => (
          <article key={label} style={cardStyle}><span className="eyebrow">{label}</span><strong style={{ display: "block", fontSize: 31, marginTop: 13, letterSpacing: "-.05em" }}>{value}</strong></article>
        ))}
      </section>

      <section style={{ marginTop: 48 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, marginBottom: 16 }}><div><span className="eyebrow">By assessment</span><h2 style={{ margin: "10px 0 0", fontSize: 27, letterSpacing: "-.04em" }}>Where your practice is landing.</h2></div></div>
        <div style={{ display: "grid", gap: 12 }}>
          {signals.map((signal) => (
            <article key={signal.testId} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                <div><h3 style={{ margin: 0, fontSize: 19 }}>{signal.title}</h3><p style={{ color: "var(--muted)", margin: "6px 0 0", fontSize: 13 }}>{signal.attempts} attempt{signal.attempts === 1 ? "" : "s"}{signal.missedQuestions ? ` · ${signal.missedQuestions} missed question${signal.missedQuestions === 1 ? "" : "s"} in latest review` : ""}</p></div>
                <div style={{ textAlign: "right" }}><strong style={{ display: "block", fontSize: 25 }}>{signal.latestPercent === null ? "—" : `${signal.latestPercent}%`}</strong><span style={{ color: "var(--muted)", fontSize: 12 }}>latest · best {signal.bestPercent === null ? "—" : `${signal.bestPercent}%`}</span></div>
              </div>
              <div style={{ height: 8, background: "var(--paper)", borderRadius: 999, marginTop: 16, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(Math.max(signal.bestPercent ?? 0, 0), 100)}%`, background: "var(--accent)", borderRadius: 999 }} /></div>
            </article>
          ))}
          {!signals.length && <div style={{ ...cardStyle, color: "var(--muted)" }}>Complete a graded assessment and this view will begin showing assessment-level signals.</div>}
        </div>
      </section>
    </main>
  );
}

const cardStyle = { border: "1px solid var(--line)", borderRadius: 20, padding: 22, background: "white" };
