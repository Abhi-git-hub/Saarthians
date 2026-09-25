import Link from "next/link";
import { getStudentAttempts, getStudentNotes } from "@/lib/student";
import { getStudentMaterials } from "@/lib/materials/service";
import { getStudentProgressSignals } from "@/lib/progress";
import { requireRole } from "@/lib/auth";
import { EmptyState, PageHeading, ProgressBar, SectionHeader } from "@/components/ui";

type Focus = { kind: string; title: string; reason: string; href: string; cta: string };

export default async function StudentWorkspace() {
  const user = await requireRole(["student"]);
  const firstName = user.displayName.split(" ")[0] || "learner";
  const [notes, attempts, signals] = await Promise.all([
    getStudentNotes(),
    getStudentAttempts(),
    getStudentProgressSignals(),
  ]);
  const materials: Array<{ id: string; title: string }> =
    (await getStudentMaterials().catch(() => null)) ?? [];

  // Tests happen offline; scores arrive from the teacher. Focus order:
  // weakest area → newest material → recent note → latest score → onboard.
  const weakest = signals
    .filter((s) => s.latestPercent !== null && s.missedQuestions > 0)
    .sort((a, b) => (a.latestPercent ?? 100) - (b.latestPercent ?? 100))[0];
  const newestMaterial = materials[0];
  const recentNote = notes[0];
  const latestGraded = attempts.find((a) => a.score !== null && a.max_score !== null);

  let focus: Focus;
  if (weakest) {
    focus = {
      kind: "Fix mistakes",
      title: weakest.title,
      reason: `${weakest.missedQuestions} question${weakest.missedQuestions === 1 ? "" : "s"} still need${weakest.missedQuestions === 1 ? "s" : ""} work — latest score ${weakest.latestPercent}%.`,
      href: "/app/results",
      cta: "Review mistakes →",
    };
  } else if (newestMaterial) {
    focus = {
      kind: "Read",
      title: newestMaterial.title,
      reason: "Fresh study material from your teacher.",
      href: "/app/materials",
      cta: "Open material →",
    };
  } else if (recentNote) {
    focus = {
      kind: "Revisit",
      title: recentNote.title,
      reason: "Your most recently touched note. Reread it, then ask the tutor about it.",
      href: "/app/notes",
      cta: "Open notes →",
    };
  } else if (latestGraded) {
    focus = {
      kind: "Latest score",
      title: `${Math.round((Number(latestGraded.score) / Math.max(Number(latestGraded.max_score), 1)) * 100)}% — keep the streak going.`,
      reason: "Your most recent class-test score. New scores from your teacher will appear here.",
      href: "/app/results",
      cta: "See results →",
    };
  } else {
    focus = {
      kind: "Begin",
      title: "Your library is empty — on purpose.",
      reason: "Write your first note. Scores from your class tests will appear here once your teacher records them.",
      href: "/app/notes/new",
      cta: "Write a note →",
    };
  }

  const recentAttempts = attempts.slice(0, 4);
  const graded = attempts.filter((a) => a.score !== null && a.max_score !== null);
  const average = graded.length
    ? Math.round(graded.reduce((sum, a) => sum + (Number(a.score) / Math.max(Number(a.max_score), 1)) * 100, 0) / graded.length)
    : null;

  return (
    <main className="workspace-page">
      <div className="container">
        <PageHeading
          eyebrow="Student workspace"
          title={<>Good to see you, <em>{firstName}.</em></>}
          lede="A calm home for notes, assessments and the learning signals that matter."
          action={<Link href="/app/notes/new" className="primary-button">New note →</Link>}
        />

        <section className="focus-hero" aria-label="Your focus today">
          <div>
            <span className="eyebrow light">Your focus today · {focus.kind}</span>
            <h2>{focus.title}</h2>
            <p>{focus.reason}</p>
            <Link href={focus.href} className="focus-hero-cta">{focus.cta}</Link>
          </div>
          <div className="focus-hero-meta" aria-hidden="true">
            <span>{graded.length} graded</span>
            <strong>{average === null ? "—" : `${average}%`}</strong>
            <span>average</span>
          </div>
        </section>

        <section className="dashboard-grid two-column">
          <article className="surface-card">
            <SectionHeader eyebrow="Scores" title="Latest class-test scores." link={{ href: "/app/results", label: "View results →" }} />
            {recentAttempts.length > 0 ? (
              <div className="data-rows">
                {recentAttempts.map((attempt) => {
                  const test = Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests;
                  const pct =
                    attempt.score !== null && attempt.max_score
                      ? Math.round((Number(attempt.score) / Number(attempt.max_score)) * 100)
                      : null;
                  return (
                    <Link key={attempt.id} href={`/app/tests/${attempt.test_id}`} className="data-row">
                      <span className="data-row-main">
                        <strong>{test?.title ?? "Assessment"}</strong>
                        <span>{attempt.status.replaceAll("_", " ")}</span>
                      </span>
                      <span className="data-row-side">
                        {pct !== null && <ProgressBar value={pct} label={`${test?.title ?? "Assessment"} score`} />}
                        <strong className="display-num">{pct === null ? "—" : `${pct}%`}</strong>
                        <span className="row-arrow" aria-hidden="true">→</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No scores recorded yet."
                body="Scores from your offline class tests appear here once your teacher records them."
                action={{ href: "/app/tests", label: "See tests →" }}
              />
            )}
          </article>
          <article className="surface-card">
            <SectionHeader eyebrow="Your rhythm" title="Strongest and weakest signals." link={{ href: "/app/progress", label: "Full journey →" }} />
            {signals.length > 0 ? (
              <div className="data-rows">
                {signals.slice(0, 4).map((signal) => (
                  <Link key={signal.testId} href="/app/progress" className="data-row">
                    <span className="data-row-main">
                      <strong>{signal.title}</strong>
                      <span>
                        {signal.attempts} attempt{signal.attempts === 1 ? "" : "s"}
                        {signal.missedQuestions > 0 ? ` · ${signal.missedQuestions} to fix` : " · clean"}
                      </span>
                    </span>
                    <span className="data-row-side">
                      {signal.bestPercent !== null && <ProgressBar value={signal.bestPercent} label={`${signal.title} best`} />}
                      <strong className="display-num">{signal.bestPercent === null ? "—" : `${signal.bestPercent}%`}</strong>
                      <span className="row-arrow" aria-hidden="true">→</span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No graded work yet."
                body="Your best scores will line up here once your teacher records your first class-test scores."
                action={{ href: "/app/tests", label: "See tests →" }}
              />
            )}
          </article>
        </section>

        <section className="assistant-banner desk">
          <div>
            <span className="eyebrow">AI Tutor · your study desk</span>
            <h2>Ask about your mistakes, not the internet.</h2>
            <p>Revision plans and explanations grounded in your coursework — with sources, not guesses.</p>
          </div>
          <Link href="/app/chat" className="primary-button" style={{ background: "white", color: "var(--ink)" }}>
            Open tutor →
          </Link>
        </section>
      </div>
    </main>
  );
}
