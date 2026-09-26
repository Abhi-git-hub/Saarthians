import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getTeacherTests } from "@/lib/teacher";
import { EmptyState, PageHeading, StatusPill } from "@/components/ui";

export default async function TeacherTestsPage() {
  const user = await requireRole(["teacher", "admin"]);
  const tests = await getTeacherTests(user.id);

  return (
    <main className="workspace-page">
      <div className="container">
        <Link href="/teacher" style={{ color: "var(--muted)", fontSize: 13 }}>← Teacher workspace</Link>
        <PageHeading
          eyebrow="Assessments"
          title={<>Build better <em>tests.</em></>}
          lede="Drafts stay private until you publish them to your assigned students."
          action={<Link href="/teacher/tests/record" className="primary-button">Record marks →</Link>}
        />
        {tests.length === 0 ? (
          <EmptyState
            title="Create your first assessment."
            body="A draft takes minutes: title, questions, a live window — then publish when it is ready for your students."
            action={{ href: "/teacher/tests/new", label: "Create a draft →" }}
          />
        ) : (
          <div className="data-rows">
            {tests.map((test) => (
              <div key={test.id} className="data-row">
                <span className="data-row-main">
                  <Link href={`/teacher/tests/${test.id}/edit`}><strong>{test.title}</strong></Link>
                  <span>{test.test_questions?.length ?? 0} questions</span>
                </span>
                <span className="data-row-side">
                  <StatusPill tone={test.status === "published" ? "live" : test.status === "draft" ? "warn" : "idle"}>
                    {test.status}
                  </StatusPill>
                  <Link href={`/teacher/tests/${test.id}/scores`} className="text-link">Scores →</Link>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
