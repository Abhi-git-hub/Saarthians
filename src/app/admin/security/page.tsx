import Link from "next/link";
import { getAdminOverview, listAdminAudit, listAdminProfiles } from "@/lib/admin";
import { adminErrorMessage } from "@/lib/admin-validation";
import { PageHeader, StatusBadge, cardStyle } from "@/components/admin/ui";

export default async function AdminSecurityPage() {
  let overview = null;
  let suspended: { id: string; display_name: string; role: string }[] = [];
  let pending: { id: string; display_name: string; role: string }[] = [];
  let recentAdmin: Awaited<ReturnType<typeof listAdminAudit>>["rows"] = [];
  let loadError: string | null = null;

  try {
    const [ov, susp, pend, audit] = await Promise.all([
      getAdminOverview(),
      listAdminProfiles({ status: "suspended", page: 1, limit: 10 }),
      listAdminProfiles({ status: "pending", page: 1, limit: 10 }),
      listAdminAudit({ page: 1 }),
    ]);
    overview = ov;
    suspended = susp.rows;
    pending = pend.rows;
    recentAdmin = audit.rows.slice(0, 10);
  } catch (error) {
    loadError = adminErrorMessage(error);
  }

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <PageHeader
        eyebrow="Security"
        title="Posture, not scores."
        lede="Only information the application legitimately holds: account states, authentication-relevant events, and administrative actions. No secrets are ever shown here."
      />

      {loadError ? (
        <div role="alert" style={{ ...cardStyle, marginTop: 28, borderColor: "#e5b4b4", background: "#fdf3f3" }}>
          <strong>Could not load security data.</strong>
          <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>{loadError}</p>
        </div>
      ) : (
        <>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginTop: 28 }}>
            <article style={cardStyle}>
              <span className="eyebrow">Active students</span>
              <strong style={{ display: "block", fontSize: 34, marginTop: 12 }}>{overview?.students_active ?? "—"}</strong>
            </article>
            <article style={cardStyle}>
              <span className="eyebrow">Suspended accounts</span>
              <strong style={{ display: "block", fontSize: 34, marginTop: 12 }}>{suspended.length}</strong>
              <Link href="/admin/users?status=suspended" style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>Review →</Link>
            </article>
            <article style={cardStyle}>
              <span className="eyebrow">Pending activation</span>
              <strong style={{ display: "block", fontSize: 34, marginTop: 12 }}>{pending.length}</strong>
              <Link href="/admin/users?status=pending" style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>Review →</Link>
            </article>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14, marginTop: 14 }}>
            <article style={cardStyle}>
              <span className="eyebrow">Suspended accounts</span>
              <div style={{ display: "grid", marginTop: 8 }}>
                {suspended.map((u) => (
                  <div key={u.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: "1px solid var(--line)", padding: "12px 0", alignItems: "center" }}>
                    <Link href={`/admin/users/${u.id}`} style={{ fontWeight: 650 }}>{u.display_name || "Unnamed"}</Link>
                    <StatusBadge status="suspended" />
                  </div>
                ))}
                {!suspended.length && <p style={{ color: "var(--muted)" }}>No suspended accounts. Good.</p>}
              </div>
            </article>

            <article style={cardStyle}>
              <span className="eyebrow">Awaiting activation</span>
              <div style={{ display: "grid", marginTop: 8 }}>
                {pending.map((u) => (
                  <div key={u.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: "1px solid var(--line)", padding: "12px 0", alignItems: "center" }}>
                    <Link href={`/admin/users/${u.id}`} style={{ fontWeight: 650 }}>{u.display_name || "Unnamed"}</Link>
                    <StatusBadge status="pending" />
                  </div>
                ))}
                {!pending.length && <p style={{ color: "var(--muted)" }}>No pending accounts.</p>}
              </div>
            </article>
          </section>

          <section style={{ ...cardStyle, marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="eyebrow">Recent administrative actions</span>
              <Link href="/admin/audit" style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>Full audit →</Link>
            </div>
            <div style={{ display: "grid", marginTop: 8 }}>
              {recentAdmin.map((event) => (
                <div key={event.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: "1px solid var(--line)", padding: "12px 0", flexWrap: "wrap" }}>
                  <span><strong>{event.action}</strong> <span style={{ color: "var(--muted)", fontSize: 13 }}>by {event.actor_name || "system"}</span></span>
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>{new Date(event.created_at).toLocaleString()}</span>
                </div>
              ))}
              {!recentAdmin.length && <p style={{ color: "var(--muted)" }}>No audited actions yet.</p>}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
