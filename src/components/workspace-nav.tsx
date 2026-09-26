"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/security";

const navigation: Record<Role, Array<[string, string]>> = {
  student: [["Notes", "/app/notes"], ["Material", "/app/materials"], ["Profile", "/app/profile"]],
  teacher: [["Notes", "/teacher/notes"], ["Material", "/teacher/materials"], ["Marks", "/teacher/marks"]],
  admin: [["Overview", "/admin"], ["Users", "/admin/users"], ["Relationships", "/admin/relationships"], ["Tests", "/admin/tests"], ["Audit", "/admin/audit"], ["Security", "/admin/security"], ["System", "/admin/system"], ["Settings", "/admin/settings"]],
};

const homeFor: Record<Role, string> = { student: "/app/notes", teacher: "/teacher/notes", admin: "/admin" };

const labels: Record<Role, string> = { student: "Student", teacher: "Teacher", admin: "Admin" };

export function WorkspaceNav({ role, displayName, username }: { role: Role; displayName: string; username?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Route the sign-out through the server as well so server-managed state
    // (e.g. the password-recovery marker, which is HTTP-only) is cleared too.
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch {
      // Non-fatal: the local session is already destroyed above.
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="workspace-nav" data-scrolled={scrolled}>
      <div className="container workspace-nav-inner">
        <Link href={homeFor[role]} className="workspace-brand">
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
