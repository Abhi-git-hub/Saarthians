import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { AdminUserProvisioner } from "../../user-provisioner";
import { PageHeader } from "@/components/admin/ui";

// Entry points for the "Add Student" / "Add Teacher" workflows. Account
// creation itself runs through AdminUserProvisioner → the provision-user Edge
// Function (single audited path); this page only sets the starting role.
export default async function NewAdminUserPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(["admin"]);
  const params = await searchParams;
  const role = params.role === "teacher" ? "teacher" : "student";

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <Link href="/admin/users" style={{ color: "var(--muted)", fontSize: 13 }}>← Users</Link>
      <div style={{ marginTop: 24 }}>
        <PageHeader
          eyebrow={role === "teacher" ? "Add teacher" : "Add student"}
          title={role === "teacher" ? "Bring a teacher onboard." : "Bring a student onboard."}
          lede={
            role === "teacher"
              ? "Teachers get an authoring workspace. Assign their students afterwards under Relationships."
              : "Students get the learning workspace. Assign a teacher afterwards under Relationships so published tests become visible."
          }
        />
      </div>
      <div style={{ marginTop: 28, maxWidth: 720 }}>
        <AdminUserProvisioner initialUsers={[]} initialRole={role} />
      </div>
    </main>
  );
}
