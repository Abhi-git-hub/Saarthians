import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const links = [
  ["Overview", "/app"],
  ["Notes", "/app/notes"],
  ["Tests", "/app/tests"],
  ["Results", "/app/results"],
  ["Progress", "/app/progress"],
];

export async function StudentNav() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <header style={{ borderBottom: "1px solid var(--line)", background: "rgba(247,248,244,.92)" }}>
      <div className="container" style={{ minHeight: 72, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <Link href="/app" style={{ fontWeight: 800, fontSize: 19, letterSpacing: "-.04em" }}>
          saarthians<span style={{ color: "var(--accent)" }}>.online</span>
        </Link>
        <nav aria-label="Student navigation" style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center", fontSize: 13, fontWeight: 650 }}>
          {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          <span style={{ color: "var(--muted)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.user?.email}</span>
          <form action="/api/auth/signout" method="post"><button type="submit" style={{ border: "1px solid var(--line)", borderRadius: 999, padding: "8px 12px", background: "transparent", cursor: "pointer" }}>Sign out</button></form>
        </nav>
      </div>
    </header>
  );
}
