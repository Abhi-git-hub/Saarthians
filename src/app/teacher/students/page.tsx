import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getTeacherStudents } from "@/lib/teacher";
import { EmptyState, PageHeading, StatusPill } from "@/components/ui";

export default async function TeacherStudentsPage() {
  const user = await requireRole(["teacher", "admin"]);
  const students = await getTeacherStudents(user.id);

  return (
    <main className="workspace-page">
      <div className="container">
        <Link href="/teacher" style={{ color: "var(--muted)", fontSize: 13 }}>← Teacher workspace</Link>
        <PageHeading
          eyebrow="Students · your roster"
          title={<>Your <em>learners.</em></>}
          lede="Only active student relationships attached to your teacher account are shown here."
        />
        {students.length === 0 ? (
          <EmptyState
            title="No learners yet."
            body="Students appear here once an administrator assigns them to your account. Then their attempts, mistakes, and progress unlock."
          />
        ) : (
          <div className="data-rows">
            {students.map((row) => {
              const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
              return (
                <Link key={row.student_id} href={`/teacher/students/${row.student_id}`} className="data-row">
                  <span className="data-row-main">
                    <strong>{profile?.display_name || "Unnamed student"}</strong>
                    <span>{profile?.status || "active"} relationship</span>
                  </span>
                  <span className="data-row-side">
                    <StatusPill tone="live">active</StatusPill>
                    <span className="row-arrow" aria-hidden="true">→</span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
