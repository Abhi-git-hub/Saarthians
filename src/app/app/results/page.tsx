import Link from "next/link";
import { getStudentAttempts } from "@/lib/student";
import { attemptStateLabel, resolveAttemptState } from "@/lib/assessment";
import { EmptyState, PageHeading, ProgressBar, StatusPill } from "@/components/ui";

export default async function ResultsPage() {
  const attempts = await getStudentAttempts();
  const graded = attempts.filter((attempt) => attempt.score !== null && attempt.max_score !== null);
  const average = graded.length
    ? Math.round(graded.reduce((sum, attempt) => sum + (Number(attempt.score) / Math.max(Number(attempt.max_score), 1)) * 100, 0) / graded.length)
    : null;
  const best = graded.length
    ? Math.round(Math.max(...graded.map((attempt) => Number(attempt.score) / Math.max(Number(attempt.max_score), 1) * 100)))
    : null;

  return (
    <main className="workspace-page">
      <div className="container">
        <PageHeading
          eyebrow="Results · your performance story"
          title={<>See the <em>work.</em></>}
          lede="Every score below is server-graded from your own answers — nothing estimated, nothing borrowed."
        />

        <section className="story-hero" aria-label="Overall performance">
          <div>
            <span className="eyebrow light">Average across graded work</span>
            <strong className="display-num">{average === null ? "—" : `${average}%`}</strong>
          </div>
          <dl>
            <div><dt>Graded</dt><dd className="display-num">{graded.length}</dd></div>
            <div><dt>Best</dt><dd className="display-num">{best === null ? "—" : `${best}%`}</dd></div>
            <div><dt>Attempts</dt><dd className="display-num">{attempts.length}</dd></div>
          </dl>
        </section>

        <section>
          {attempts.length > 0 ? (
            <div className="data-rows">
              {attempts.map((attempt) => {
                const test = Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests;
                const percent =
                  attempt.score !== null && attempt.max_score
                    ? Math.round((Number(attempt.score) / Number(attempt.max_score)) * 100)
                    : null;
                const state = resolveAttemptState(attempt.status, attempt.submission_reason);
                return (
                  <div key={attempt.id} className="data-row">
                    <span className="data-row-main">
                      <strong>{test?.title ?? "Assessment"}</strong>
                      <span>
                        {attemptStateLabel(state)}
                        {attempt.submitted_at
                          ? ` · ${new Date(attempt.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                          : ""}
                      </span>
                    </span>
                    <span className="data-row-side">
                      {percent !== null && <ProgressBar value={percent} label={`${test?.title ?? "Assessment"} score`} />}
                      <strong className="display-num">{percent === null ? "—" : `${percent}%`}</strong>
                      {percent !== null ? (
                        <Link href={`/app/results/${attempt.id}`} className="text-link">Review →</Link>
                      ) : (
                        <StatusPill tone="idle">pending</StatusPill>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No attempts on record yet."
              body="Your story starts with your first assessment. Scores, mistakes, and reviews will line up here."
              action={{ href: "/app/tests", label: "Browse assessments →" }}
            />
          )}
        </section>
      </div>
    </main>
  );
}
