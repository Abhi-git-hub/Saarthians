"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/security";

const navigation: Record<Role, Array<[string, string]>> = {
  student: [["Overview", "/app"], ["Notes", "/app/notes"], ["Tests", "/app/tests"], ["Results", "/app/results"], ["Progress", "/app/progress"], ["Profile", "/app/profile"]],
  teacher: [["Overview", "/teacher"], ["Students", "/teacher/students"], ["Tests", "/teacher/tests"], ["Results", "/teacher/results"], ["Profile", "/teacher/profile"]],
  admin: [["Overview", "/admin"], ["Users", "/admin/users"], ["Relationships", "/admin/relationships"], ["Tests", "/admin/tests"], ["Audit", "/admin/audit"], ["Security", "/admin/security"], ["System", "/admin/system"]],
};

const labels: Record<Role, string> = { student: "Student", teacher: "Teacher", admin: "Admin" };

export function WorkspaceNav({ role, displayName, username }: { role: Role; displayName: string; username?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="workspace-nav">
      <div className="container workspace-nav-inner">
        <Link href={role === "student" ? "/app" : role === "teacher" ? "/teacher" : "/admin"} className="workspace-brand">
          saarthians<span>.online</span>
        </Link>
        <nav className="workspace-links" aria-label={`${labels[role]} workspace navigation`}>
          {navigation[role].map(([label, href]) => {
            const cleanHref = href.split("#")[0];
            const active = pathname === cleanHref || (cleanHref !== "/app" && cleanHref !== "/teacher" && cleanHref !== "/admin" && pathname.startsWith(`${cleanHref}/`));
            return <Link key={href} href={href} className="workspace-link" data-active={active}>{label}</Link>;
          })}
        </nav>
        <div className="workspace-identity">
          <div className="workspace-avatar" aria-hidden="true">{displayName.trim().slice(0, 1).toUpperCase() || "S"}</div>
          <div className="workspace-user-copy">
            <strong>{displayName || labels[role]}</strong>
            <span>{username ? `@${username}` : labels[role]}</span>
          </div>
          <button type="button" className="workspace-signout" onClick={signOut}>Sign out</button>
        </div>
      </div>
    </header>
  );
}
