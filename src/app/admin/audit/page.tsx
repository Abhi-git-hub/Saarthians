import Link from "next/link";
import { listAdminAudit } from "@/lib/admin";
import { AUDIT_PAGE_SIZE, adminErrorMessage } from "@/lib/admin-validation";
import { EmptyState, FilteredPagination, PageHeader, cardStyle, fieldStyle } from "@/components/admin/ui";

function safeMetadata(value: unknown): string {
  if (value === null || value === undefined) return "—";
  try {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    return text.length > 280 ? `${text.slice(0, 280)}…` : text;
  } catch {
    return "—";
  }
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const action = typeof params.action === "string" ? params.action.trim().slice(0, 120) : "";
  const search = typeof params.search === "string" ? params.search.trim().slice(0, 120) : "";
  const page = Math.max(1, Number(params.page) || 1);
  const query = new URLSearchParams({ ...(action ? { action } : {}), ...(search ? { search } : {}) }).toString();

  let rows: Awaited<ReturnType<typeof listAdminAudit>>["rows"] = [];
  let total = 0;
  let currentPage = page;
  let loadError: string | null = null;

  try {
    const result = await listAdminAudit({ action: action || null, search: search || null, page });
    rows = result.rows;
    total = result.total;
    currentPage = result.page;
  } catch (error) {
    loadError = adminErrorMessage(error);
  }

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <PageHeader
        eyebrow="Audit"
        title="What happened."
        lede="Server-generated trail of administrative and security-relevant actions. Rows are written by database functions — never by the browser."
      />

      <form method="get" style={{ ...cardStyle, marginTop: 28, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, alignItems: "end" }}>
        <label style={labelStyle}>
          Exact action
          <input name="action" defaultValue={action} placeholder="e.g. admin.set_profile_status" maxLength={120} style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          Search
          <input name="search" defaultValue={search} placeholder="Action or resource…" maxLength={120} style={fieldStyle} />
        </label>
        <div><button type="submit" style={primaryButton}>Apply</button></div>
      </form>

      {loadError ? (
        <div role="alert" style={{ ...cardStyle, marginTop: 16, borderColor: "#e5b4b4", background: "#fdf3f3" }}>
          <strong>Could not load audit events.</strong>
          <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>{loadError}</p>
        </div>
      ) : rows.length === 0 ? (
        <div style={{ marginTop: 16 }}><EmptyState title="No audit events." body="Administrative actions will appear here once performed." /></div>
      ) : (
        <section style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {rows.map((event) => (
            <article key={event.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
                <strong style={{ fontSize: 15 }}>{event.action}</strong>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>{new Date(event.created_at).toLocaleString()}</span>
              </div>
              <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>
                Actor: {event.actor_user_id ? <Link href={`/admin/users/${event.actor_user_id}`} style={{ textDecoration: "underline" }}>{event.actor_name || "unknown"}</Link> : "system"}
                {" "}· Resource: {event.resource_type}
              </div>
              <code style={{ display: "block", marginTop: 8, fontSize: 12, color: "var(--muted)", wordBreak: "break-word" }}>
                {safeMetadata(event.metadata_json)}
              </code>
            </article>
          ))}
        </section>
      )}

      <FilteredPagination page={currentPage} total={total} pageSize={AUDIT_PAGE_SIZE} query={query} />
    </main>
  );
}

const labelStyle = { display: "grid", gap: 8, fontSize: 13, fontWeight: 700 };
const primaryButton = { border: 0, borderRadius: 999, padding: "12px 18px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer", fontSize: 14 } as const;
