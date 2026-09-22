import Link from "next/link";
import { listAdminProfiles } from "@/lib/admin";
import { adminErrorMessage } from "@/lib/admin-validation";
import { EmptyState, FilteredPagination, PageHeader, StatusBadge } from "@/components/admin/ui";
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
          <Link href="/admin/users/new?role=student" className="primary-button">+ Add Student</Link>
          <Link href="/admin/users/new?role=teacher" className="primary-button" style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }}>+ Add Teacher</Link>
        </div>
      </div>

      <form method="get" className="admin-filterbar">
        <label>
          Search
          <input name="search" defaultValue={search} placeholder="Display name…" maxLength={120} />
        </label>
        <label>
          Role
          <select name="role" defaultValue={role}>
            <option value="">All roles</option>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label>
          Status
          <select name="status" defaultValue={status}>
            <option value="">All statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <div className="admin-filter-actions">
          <button type="submit" className="primary-button">Apply</button>
          <Link href="/admin/users" className="text-link">Clear</Link>
        </div>
      </form>

      {loadError ? (
        <div role="alert" className="admin-error">
          <strong>Could not load users.</strong>
          <p>{loadError}</p>
        </div>
      ) : rows.length === 0 ? (
        <div style={{ marginTop: 16 }}>
          <EmptyState title="No users match." body="Adjust the search or filters, or provision a new account." />
        </div>
      ) : (
        <section style={{ marginTop: 8 }}>
          <p className="admin-count" aria-live="polite">{total} account{total === 1 ? "" : "s"} · page {currentPage}</p>
          <div className="data-rows admin-rows">
            {rows.map((profile) => (
              <div key={profile.id} className="data-row">
                <span className="data-row-main">
                  <Link href={`/admin/users/${profile.id}`}><strong>{profile.display_name || "Unnamed"}</strong></Link>
                  <span>
                    {profile.role}{profile.username ? ` · @${profile.username}` : ""}
                    {profile.role === "student" && profile.grade_level ? ` · ${profile.grade_level}` : ""}
                    {profile.role === "teacher" && profile.subject ? ` · ${profile.subject}` : ""}
                    {" "}· joined {new Date(profile.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </span>
                <span className="data-row-side">
                  <StatusBadge status={profile.status} />
                  <Link href={`/admin/users/${profile.id}`} className="text-link">Open →</Link>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <FilteredPagination page={currentPage} total={total} pageSize={PAGE_SIZE} query={query} />
    </main>
  );
}
