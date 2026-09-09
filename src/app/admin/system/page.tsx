import { getAdminDbTime, getAdminOverview } from "@/lib/admin";
import { adminErrorMessage } from "@/lib/admin-validation";
import { PageHeader, cardStyle } from "@/components/admin/ui";

export default async function AdminSystemPage() {
  let overview = null;
  let dbTime: string | null = null;
  let loadError: string | null = null;

  try {
    [overview, dbTime] = await Promise.all([getAdminOverview(), getAdminDbTime()]);
  } catch (error) {
    loadError = adminErrorMessage(error);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const rows: [string, string][] = [
    ["Application", "Saarthians 0.1.0"],
    ["Production domain", "saarthians.online"],
    ["Supabase project", supabaseUrl ? hostOf(supabaseUrl) : "not configured"],
    ["Database", dbTime ? `reachable · server time ${new Date(dbTime).toLocaleString()}` : "unreachable"],
    ["User provisioning", "provision-user Edge Function (audited, admin-only)"],
    ["Platform totals", overview ? `${overview.students_total} students · ${overview.teachers_total} teachers · ${overview.tests_total} tests · ${overview.attempts_total} attempts` : "unavailable"],
  ];

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <PageHeader
        eyebrow="System"
        title="Operations."
        lede="Only information that is safe to expose: deployment identity, connectivity, and feature readiness. No secrets, keys, or credentials appear here."
      />

      {loadError && (
        <div role="alert" style={{ ...cardStyle, marginTop: 28, borderColor: "#e5b4b4", background: "#fdf3f3" }}>
          <strong>Live system data is unavailable.</strong>
          <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>{loadError}</p>
        </div>
      )}

      <section style={{ ...cardStyle, marginTop: 28, display: "grid" }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, padding: "14px 0", borderTop: "1px solid var(--line)" }}>
            <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>
            <span style={{ fontSize: 14 }}>{value}</span>
          </div>
        ))}
      </section>

      <section style={{ ...cardStyle, marginTop: 14 }}>
        <span className="eyebrow">Feature availability</span>
        <ul style={{ margin: "12px 0 0", paddingLeft: 20, lineHeight: 1.8, color: "var(--muted)", fontSize: 14 }}>
          <li>Student workspace, teacher workspace, and server-graded assessments are live application routes.</li>
          <li>Admin user provisioning runs through the provision-user Edge Function with rollback and audit.</li>
          <li>Admin audit and relationship controls require the latest database migration to be applied.</li>
        </ul>
      </section>
    </main>
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return "misconfigured";
  }
}
