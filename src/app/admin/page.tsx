import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { AdminUserProvisioner, type AdminManagedUser } from "./user-provisioner";

export default async function AdminWorkspace() {
  const user = await requireRole(["admin"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,display_name,username,role,status,phone,grade_level,subject,created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error("ADMIN_DATA_UNAVAILABLE");
  const users = (data ?? []) as AdminManagedUser[];
  const students = users.filter((item) => item.role === "student");
  const teachers = users.filter((item) => item.role === "teacher");
  const active = users.filter((item) => item.status === "active");

  return (
    <main className="workspace-page">
      <div className="container">
        <section className="dashboard-hero">
          <div>
            <span className="eyebrow">Administration</span>
            <h1>Keep the whole learning system in view.</h1>
            <p>Provision accounts, maintain clean role boundaries, and keep high-risk access changes visible and auditable.</p>
          </div>
          <div className="hero-meta">
            <span className="status-dot" />
            <span>Signed in as {user.email ?? user.username ?? "administrator"}</span>
          </div>
        </section>

        <section className="metric-grid" aria-label="Administration metrics">
          <article className="metric-card"><span>Active accounts</span><strong>{active.length}</strong><small>currently allowed into workspaces</small></article>
          <article className="metric-card"><span>Students</span><strong>{students.length}</strong><small>learner identities provisioned</small></article>
          <article className="metric-card"><span>Teachers</span><strong>{teachers.length}</strong><small>teaching identities provisioned</small></article>
          <article className="metric-card"><span>Total profiles</span><strong>{users.length}</strong><small>including inactive accounts</small></article>
        </section>

        <section aria-label="Management sections" style={{ marginTop: 28 }}>
          <span className="eyebrow">Manage</span>
          <div className="metric-grid" style={{ marginTop: 12 }}>
            <Link className="metric-card" href="/admin/users"><span>User management</span><strong>→</strong><small>search, status, detail, add student/teacher</small></Link>
            <Link className="metric-card" href="/admin/relationships"><span>Relationships</span><strong>→</strong><small>assign students to teachers</small></Link>
            <Link className="metric-card" href="/admin/tests"><span>Assessments</span><strong>→</strong><small>visibility into tests and attempts</small></Link>
            <Link className="metric-card" href="/admin/audit"><span>Audit</span><strong>→</strong><small>server-generated action trail</small></Link>
            <Link className="metric-card" href="/admin/security"><span>Security</span><strong>→</strong><small>account states and recent actions</small></Link>
            <Link className="metric-card" href="/admin/system"><span>System</span><strong>→</strong><small>connectivity and readiness</small></Link>
          </div>
        </section>

        <section id="users" className="admin-grid">
          <AdminUserProvisioner initialUsers={users} />
          <aside className="system-panel">
            <span className="eyebrow">Provisioning rules</span>
            <h2>Make identity boring.</h2>
            <div className="rule-list">
              <div><b>01</b><span>Only active administrators can create student or teacher accounts.</span></div>
              <div><b>02</b><span>Students and teachers sign in with the username and password assigned to them.</span></div>
              <div><b>03</b><span>Passwords are handled by Supabase Auth and never stored in profiles.</span></div>
              <div><b>04</b><span>Role, status, and username changes are protected by server and database authorization.</span></div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
