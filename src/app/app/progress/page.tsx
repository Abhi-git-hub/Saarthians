import Link from "next/link";
import { getStudentAttempts, getStudentNotes, getStudentTests } from "@/lib/student";
import { getStudentProgressSignals } from "@/lib/progress";
import { EmptyState, PageHeading, ProgressBar } from "@/components/ui";

export default async function ProgressPage() {
  const [attempts, notes, tests, signals] = await Promise.all([
    getStudentAttempts(),
    getStudentNotes(),
    getStudentTests(),
    getStudentProgressSignals(),
  ]);
  const graded = attempts.filter((attempt) => attempt.score !== null && attempt.max_score !== null);
  const average = graded.length
    ? Math.round(graded.reduce((sum, attempt) => sum + (Number(attempt.score) / Math.max(Number(attempt.max_score), 1)) * 100, 0) / graded.length)
    : null;

  return (
    <main className="workspace-page">
      <div className="container">
        <PageHeading
          eyebrow="Progress · your journey"
          title={<>Make progress <em>visible.</em></>}
          lede="A signal built only from your own assessment history — never a leaderboard, never invented trends."
        />

        <section className="story-strip" aria-label="Totals">
          {[
            ["Average", average === null ? "—" : `${average}%`],
            ["Graded attempts", String(graded.length)],
            ["Notes", String(notes.length)],
            ["Live tests", String(tests.length)],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong className="display-num">{value}</strong>
            </div>
          ))}
        </section>

        <section className="journey">
          <span className="eyebrow">By assessment</span>
          <h2>Where your practice is landing.</h2>
          {signals.length > 0 ? (
            <div className="data-rows">
              {signals.map((signal) => (
                <div key={signal.testId} className="data-row journey-row">
                  <span className="data-row-main">
                    <strong>{signal.title}</strong>
                    <span>
                      {signal.attempts} attempt{signal.attempts === 1 ? "" : "s"}
                      {signal.missedQuestions > 0
                        ? ` · ${signal.missedQuestions} missed in latest review`
                        : " · latest review clean"}
                    </span>
                    <ProgressBar value={signal.bestPercent ?? 0} label={`${signal.title} best score`} />
                  </span>
                  <span className="data-row-side journey-scores">
                    <span><small>latest</small><strong className="display-num">{signal.latestPercent === null ? "—" : `${signal.latestPercent}%`}</strong></span>
                    <span><small>best</small><strong className="display-num">{signal.bestPercent === null ? "—" : `${signal.bestPercent}%`}</strong></span>
                    {signal.missedQuestions > 0 && (
                      <Link href="/app/chat" className="text-link">Fix with tutor →</Link>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Your journey map is blank."
              body="Complete a graded assessment and this view will trace every test — latest, best, and exactly what still needs work."
              action={{ href: "/app/tests", label: "Take your first test →" }}
            />
          )}
        </section>
      </div>
    </main>
  );
}
