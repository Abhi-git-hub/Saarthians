import { requireRole } from "@/lib/auth";

export default async function TeacherProfilePage() {
  const user = await requireRole(["teacher", "admin"]);
  return <main className="workspace-page"><div className="container narrow"><section className="dashboard-hero"><div><span className="eyebrow">Profile</span><h1>Your teaching identity.</h1><p>Your account details are provisioned centrally so role and ownership remain authoritative.</p></div></section><section className="profile-grid"><div className="surface-card profile-hero"><div className="profile-avatar">{user.displayName.slice(0,1).toUpperCase()}</div><h2>{user.displayName}</h2><span>@{user.username ?? "teacher"}</span></div><div className="surface-card"><span className="eyebrow">Account</span><div className="detail-list"><div><span>Role</span><strong>{user.role === "admin" ? "Admin access" : "Teacher"}</strong></div><div><span>Username</span><strong>{user.username ?? "—"}</strong></div><div><span>Sign-in</span><strong>Username + password</strong></div><div><span>Access</span><strong>Active</strong></div></div></div></section></div></main>;
}
