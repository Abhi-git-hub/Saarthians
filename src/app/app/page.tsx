import Link from "next/link";
import { getStudentAttempts, getStudentNotes, getStudentTests } from "@/lib/student";
import { requireRole } from "@/lib/auth";

export default async function StudentWorkspace() {
  const user = await requireRole(["student"]);
  const [notes, tests, attempts] = await Promise.all([getStudentNotes(), getStudentTests(), getStudentAttempts()]);
  const graded = attempts.filter((a) => a.score !== null && a.max_score !== null);
  const average = graded.length ? Math.round(graded.reduce((sum, a) => sum + Number(a.score) / Math.max(Number(a.max_score), 1) * 100, 0) / graded.length) : null;
  const latestAttempt = attempts[0];

  return (
    <main className="workspace-page">
      <div className="container">
        <section className="dashboard-hero split">
          <div><span className="eyebrow">Student workspace</span><h1>Good to see you, {user.displayName.split(" ")[0] || "learner"}.</h1><p>A calm home for notes, assessments and the learning signals that matter.</p></div>
          <Link href="/app/notes/new" className="primary-button">New note →</Link>
        </section>

        <section className="metric-grid" aria-label="Learning overview">
          <Link className="metric-card interactive" href="/app/notes"><span>Notes</span><strong>{notes.length}</strong><small>your personal learning archive</small></Link>
          <Link className="metric-card interactive" href="/app/tests"><span>Available tests</span><strong>{tests.length}</strong><small>assessments ready for you</small></Link>
          <Link className="metric-card interactive" href="/app/results"><span>Attempts</span><strong>{attempts.length}</strong><small>assessment history</small></Link>
          <Link className="metric-card interactive" href="/app/progress"><span>Average</span><strong>{average === null ? "—" : `${average}%`}</strong><small>across graded attempts</small></Link>
        </section>

        <section className="dashboard-grid two-column">
          <article className="surface-card">
            <div className="section-heading"><div><span className="eyebrow">Continue</span><h2>Pick up where you left off.</h2></div><Link href="/app/results" className="text-link">View results →</Link></div>
            {latestAttempt ? <div className="focus-row"><div><strong>{latestAttempt.tests?.[0]?.title ?? "Assessment"}</strong><span>{latestAttempt.status.replaceAll("_", " ")}</span></div><div className="focus-score">{latestAttempt.score !== null && latestAttempt.max_score ? `${Math.round(Number(latestAttempt.score) / Number(latestAttempt.max_score) * 100)}%` : "—"}</div></div> : <div className="empty-state">Your first assessment will appear here once you start one.</div>}
          </article>
          <article className="surface-card">
            <div className="section-heading"><div><span className="eyebrow">Your rhythm</span><h2>Keep the next step obvious.</h2></div></div>
            <div className="action-stack"><Link href="/app/notes" className="action-row"><span><b>Review notes</b><small>Turn recent notes into your next study move.</small></span><b>→</b></Link><Link href="/app/tests" className="action-row"><span><b>Take a test</b><small>Practice under the same server-controlled assessment rules.</small></span><b>→</b></Link><Link href="/app/progress" className="action-row"><span><b>Check progress</b><small>See your assessment history without invented subject scores.</small></span><b>→</b></Link></div>
          </article>
        </section>

        <section className="assistant-banner"><div><span className="eyebrow">Learning assistant</span><h2>Your reasoning partner is next.</h2><p>The future tutor will work from your authorized learning context, not from unrestricted student data.</p></div><span className="coming-badge">Next milestone</span></section>
      </div>
    </main>
  );
}