import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getStudentAttempts } from "@/lib/student";
import { EmptyState } from "@/components/ui";

// The only place a student sees marks: their own profile. Rows come from
// getStudentAttempts, which reads only the caller's attempts — a student can
// never see anyone else's scores, by query and by RLS alike.
export default async function StudentProfilePage() {
  const user = await requireRole(["student"]);
  const attempts = await getStudentAttempts().catch(() => []);
  const graded = attempts.filter((a) => a.score !== null && a.max_score !== null);
  const average = graded.length
    ? Math.round(
        graded.reduce((sum, a) => sum + (Number(a.score) / Math.max(Number(a.max_score), 1)) * 100, 0) / graded.length,
      )
    : null;

  return (
    <main className="workspace-page">
      <div className="container narrow">
        <section className="dashboard-hero">
          <div>
            <span className="eyebrow">Profile</span>
            <h1>Your learning identity.</h1>
            <p>Your account details are provisioned and protected by the Saarthians access model.</p>
          </div>
        </section>
        <section className="profile-grid">
          <div className="surface-card profile-hero">
            <div className="profile-avatar">{user.displayName.slice(0, 1).toUpperCase()}</div>
            <h2>{user.displayName}</h2>
            <span>@{user.username ?? "student"}</span>
          </div>
          <div className="surface-card">
            <span className="eyebrow">Account</span>
            <div className="detail-list">
              <div><span>Role</span><strong>Student</strong></div>
              <div><span>Username</span><strong>{user.username ?? "—"}</strong></div>
              <div><span>Sign-in</span><strong>Username + password</strong></div>
              <div><span>Access</span><strong>Active</strong></div>
            </div>
            <Link href="/app/settings" className="text-link" style={{ display: "inline-block", marginTop: 14 }}>
              Account settings →
            </Link>
          </div>
        </section>
        <section className="surface-card" style={{ marginTop: 18 }} aria-label="My marks">
          <div className="section-heading">
            <div>
              <span className="eyebrow">My marks</span>
              <h2>Class tests, recorded by your teacher.</h2>
            </div>
            {average !== null && <strong className="display-num">{average}% avg</strong>}
          </div>
          {graded.length > 0 ? (
            <div className="data-rows">
              {graded.map((attempt) => {
                const test = Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests;
                const pct = Math.round((Number(attempt.score) / Math.max(Number(attempt.max_score), 1)) * 100);
                return (
                  <div key={attempt.id} className="data-row">
                    <span className="data-row-main">
                      <strong>{test?.title ?? "Class test"}</strong>
                      <span>
                        {attempt.submitted_at
                          ? new Date(attempt.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : ""}
                      </span>
                    </span>
                    <span className="data-row-side">
                      <strong className="display-num">{attempt.score} / {attempt.max_score}</strong>
                      <span style={{ color: "var(--muted)", fontSize: 13 }}>{pct}%</span>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No marks recorded yet."
              body="Scores from your offline class tests appear here once your teacher records them."
            />
          )}
        </section>
      </div>
    </main>
  );
}
