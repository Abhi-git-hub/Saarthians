import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getTeacherResults, getTeacherStudents, getTeacherTests } from "@/lib/teacher";
import { EmptyState, PageHeading, StatusPill } from "@/components/ui";

export default async function TeacherWorkspace() {
  const user = await requireRole(["teacher", "admin"]);
  const firstName = user.displayName.split(" ")[0] || "teacher";
  const [students, tests, results] = await Promise.all([
    getTeacherStudents(user.id),
    getTeacherTests(user.id),
    getTeacherResults(user.id),
  ]);
  const gradedPercentages = results
    .filter((item) => item.score !== null && item.max_score !== null)
    .map((item) => (Number(item.score) / Math.max(Number(item.max_score), 1)) * 100);
  const average = gradedPercentages.length
    ? Math.round(gradedPercentages.reduce((a, b) => a + b, 0) / gradedPercentages.length)
    : null;
  const drafts = tests.filter((t) => t.status === "draft").length;

  return (
    <main className="workspace-page">
      <div className="container">
        <PageHeading
          eyebrow="Teacher workspace · command center"
          title={<>Good to see you, <em>{firstName}.</em></>}
          lede="Your learners, your material, your assessments — every action below stays inside your ownership boundaries."
        />

        <nav className="command-strip" aria-label="Primary actions">
          <Link href="/teacher/materials/new">
            <strong>Upload material</strong>
            <span>PDF → students + tutor</span>
          </Link>
          <Link href="/teacher/tests/new">
            <strong>Create test</strong>
            <span>Draft → schedule → publish</span>
          </Link>
          <Link href="/teacher/students">
            <strong>View students</strong>
            <span>{students.length} assigned learner{students.length === 1 ? "" : "s"}</span>
          </Link>
        </nav>

        <section className="story-strip command-stats" aria-label="Workspace totals">
          {[
            ["Students", String(students.length)],
            ["Assessments", String(tests.length)],
            ["Drafts waiting", String(drafts)],
            ["Average", average === null ? "—" : `${average}%`],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong className="display-num">{value}</strong>
            </div>
          ))}
        </section>

        <section className="dashboard-grid two-column">
          <article className="surface-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Learners</span>
                <h2>Who needs attention.</h2>
              </div>
              <Link href="/teacher/students" className="text-link">Open roster →</Link>
            </div>
            {students.length > 0 ? (
              <div className="data-rows">
                {students.slice(0, 5).map((item) => (
                  <Link key={item.student_id} href="/teacher/students" className="data-row">
                    <span className="data-row-main">
                      <strong>{item.profiles?.[0]?.display_name ?? "Student"}</strong>
                      <span>Assigned learner</span>
                    </span>
                    <span className="data-row-side">
                      <StatusPill tone="live">active</StatusPill>
                      <span className="row-arrow" aria-hidden="true">→</span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No learners assigned yet."
                body="An admin links students to your account. Once assigned, their attempts and signals appear here."
              />
            )}
          </article>
          <article className="surface-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Assessments</span>
                <h2>Build and review deliberately.</h2>
              </div>
              <Link href="/teacher/tests" className="text-link">Open tests →</Link>
            </div>
            {tests.length > 0 ? (
              <div className="data-rows">
                {tests.slice(0, 5).map((test) => (
                  <Link key={test.id} href={`/teacher/tests/${test.id}/edit`} className="data-row">
                    <span className="data-row-main">
                      <strong>{test.title}</strong>
                      <span>
                        {test.test_questions?.length ?? 0} questions · {test.status}
                      </span>
                    </span>
                    <span className="data-row-side">
                      <StatusPill tone={test.status === "published" ? "live" : test.status === "draft" ? "warn" : "idle"}>
                        {test.status}
                      </StatusPill>
                      <span className="row-arrow" aria-hidden="true">→</span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No assessments yet."
                body="Drafts stay private until you publish them to your assigned students."
                action={{ href: "/teacher/tests/new", label: "Create a draft →" }}
              />
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
