import Link from "next/link";
import { listAdminProfiles } from "@/lib/admin";
import { adminErrorMessage } from "@/lib/admin-validation";
import { EmptyState, FilteredPagination, PageHeader, StatusBadge, cardStyle, fieldStyle } from "@/components/admin/ui";
import { PAGE_SIZE } from "@/lib/admin-validation";

const roles = ["student", "teacher", "admin"];
const statuses = ["active", "pending", "suspended"];

function clean(value: unknown, allowed: string[]) {
  const text = typeof value === "string" ? value.trim() : "";
  return allowed.includes(text) ? text : "";
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const role = clean(params.role, roles);
  const status = clean(params.status, statuses);
  const search = typeof params.search === "string" ? params.search.trim().slice(0, 120) : "";
  const page = Math.max(1, Number(params.page) || 1);
  const query = new URLSearchParams({
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
  }).toString();

  let rows: Awaited<ReturnType<typeof listAdminProfiles>>["rows"] = [];
  let total = 0;
  let currentPage = page;
  let loadError: string | null = null;

  try {
    const result = await listAdminProfiles({ role: role || null, status: status || null, search: search || null, page });
    rows = result.rows;
    total = result.total;
    currentPage = result.page;
  } catch (error) {
    loadError = adminErrorMessage(error);
  }

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "end", flexWrap: "wrap" }}>
        <PageHeader eyebrow="Users" title="Everyone." lede="Search, filter, and manage student, teacher, and admin accounts." />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/admin/users/new?role=student" style={primaryButton}>+ Add Student</Link>
          <Link href="/admin/users/new?role=teacher" style={secondaryButton}>+ Add Teacher</Link>
        </div>
      </div>

      <form method="get" style={{ ...cardStyle, marginTop: 28, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        <label style={labelStyle}>
          Search
          <input name="search" defaultValue={search} placeholder="Display name…" maxLength={120} style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          Role
          <select name="role" defaultValue={role} style={fieldStyle}>
            <option value="">All roles</option>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          Status
          <select name="status" defaultValue={status} style={fieldStyle}>
            <option value="">All statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <div style={{ alignSelf: "end", display: "flex", gap: 10 }}>
          <button type="submit" style={primaryButton}>Apply</button>
          <Link href="/admin/users" style={{ ...secondaryButton, textDecoration: "none" }}>Clear</Link>
        </div>
      </form>

      {loadError ? (
        <div role="alert" style={{ ...cardStyle, marginTop: 16, borderColor: "#e5b4b4", background: "#fdf3f3" }}>
          <strong>Could not load users.</strong>
          <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>{loadError}</p>
        </div>
      ) : rows.length === 0 ? (
        <div style={{ marginTop: 16 }}>
          <EmptyState title="No users match." body="Adjust the search or filters, or provision a new account." />
        </div>
      ) : (
        <section style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {rows.map((profile) => (
            <article key={profile.id} style={{ ...cardStyle, display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center" }}>
              <div>
                <Link href={`/admin/users/${profile.id}`} style={{ fontSize: 17, fontWeight: 750 }}>
                  {profile.display_name || "Unnamed"}
                </Link>
                <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
                  {profile.role}{profile.username ? ` · @${profile.username}` : ""}
                  {profile.role === "student" && profile.grade_level ? ` · ${profile.grade_level}` : ""}
                  {profile.role === "teacher" && profile.subject ? ` · ${profile.subject}` : ""}
                  {" "}· joined {new Date(profile.created_at).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <StatusBadge status={profile.status} />
                <Link href={`/admin/users/${profile.id}`} style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>Open →</Link>
              </div>
            </article>
          ))}
        </section>
      )}

      <FilteredPagination page={currentPage} total={total} pageSize={PAGE_SIZE} query={query} />
    </main>
  );
}

const labelStyle = { display: "grid", gap: 8, fontSize: 13, fontWeight: 700 };
const primaryButton = { border: 0, borderRadius: 999, padding: "12px 18px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer", fontSize: 14 } as const;
const secondaryButton = { border: "1px solid var(--line)", borderRadius: 999, padding: "12px 18px", background: "white", color: "var(--ink)", fontWeight: 700, cursor: "pointer", fontSize: 14 } as const;
