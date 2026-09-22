"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/security";

const navigation: Record<Role, Array<[string, string]>> = {
  student: [["Overview", "/app"], ["Notes", "/app/notes"], ["Material", "/app/materials"], ["Tests", "/app/tests"], ["Results", "/app/results"], ["Progress", "/app/progress"], ["AI Tutor", "/app/chat"], ["Profile", "/app/profile"], ["Settings", "/app/settings"]],
  teacher: [["Overview", "/teacher"], ["Students", "/teacher/students"], ["Notes", "/teacher/notes"], ["Material", "/teacher/materials"], ["Tests", "/teacher/tests"], ["Results", "/teacher/results"], ["Progress", "/teacher/progress"], ["Profile", "/teacher/profile"], ["Settings", "/teacher/settings"]],
  admin: [["Overview", "/admin"], ["Users", "/admin/users"], ["Relationships", "/admin/relationships"], ["Tests", "/admin/tests"], ["Audit", "/admin/audit"], ["Security", "/admin/security"], ["System", "/admin/system"], ["Settings", "/admin/settings"]],
};

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
    // If a test attempt is active, warn and finalize it first: signing out
    // submits the attempt (server decides manual-leave vs past-deadline).
    // Never silently discard an attempt.
    try {
      const raw = window.sessionStorage.getItem("saarthians-active-attempt");
      if (raw) {
        const active = JSON.parse(raw) as { attemptId?: string };
        if (active?.attemptId) {
          const confirmed = window.confirm(
            "You have an assessment in progress. Signing out will submit it now. Continue?",
          );
          if (!confirmed) return;
          try {
            await fetch("/api/attempts/finalize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ attemptId: active.attemptId, reason: "signout_finalize" }),
            });
          } catch {
            // The server sweep will finalize it; continue signing out.
          }
          window.sessionStorage.removeItem("saarthians-active-attempt");
        }
      }
    } catch {
      // Storage may be unavailable; fall through to normal sign-out.
    }
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
