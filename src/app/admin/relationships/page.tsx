import { listAdminProfiles, listAdminRelationships } from "@/lib/admin";
import { adminErrorMessage } from "@/lib/admin-validation";
import { EmptyState, FilteredPagination, PageHeader, cardStyle, fieldStyle } from "@/components/admin/ui";
import { PAGE_SIZE } from "@/lib/admin-validation";
import { RelationshipManager } from "./relationship-manager";

export default async function AdminRelationshipsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search.trim().slice(0, 120) : "";
  const page = Math.max(1, Number(params.page) || 1);
  const query = new URLSearchParams({ ...(search ? { search } : {}) }).toString();

  let rows: Awaited<ReturnType<typeof listAdminRelationships>>["rows"] = [];
  let total = 0;
  let currentPage = page;
  let teachers: { id: string; display_name: string; username: string | null }[] = [];
  let students: { id: string; display_name: string; username: string | null }[] = [];
  let loadError: string | null = null;

  try {
    const [rel, t, s] = await Promise.all([
      listAdminRelationships({ search: search || null, page }),
      listAdminProfiles({ role: "teacher", status: "active", page: 1, limit: 100 }),
      listAdminProfiles({ role: "student", page: 1, limit: 100 }),
    ]);
    rows = rel.rows;
    total = rel.total;
    currentPage = rel.page;
    teachers = t.rows;
    students = s.rows;
  } catch (error) {
    loadError = adminErrorMessage(error);
  }

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <PageHeader
        eyebrow="Relationships"
        title="Who learns from whom."
        lede="Assign students to teachers. Published tests become visible to students only through an active relationship."
      />

      <form method="get" style={{ ...cardStyle, marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
        <label style={{ display: "grid", gap: 8, fontSize: 13, fontWeight: 700, flex: "1 1 240px" }}>
          Search teachers or students
          <input name="search" defaultValue={search} placeholder="Display name…" maxLength={120} style={fieldStyle} />
        </label>
        <button type="submit" style={primaryButton}>Apply</button>
      </form>

      {loadError ? (
        <div role="alert" style={{ ...cardStyle, marginTop: 16, borderColor: "#e5b4b4", background: "#fdf3f3" }}>
          <strong>Could not load relationships.</strong>
          <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>{loadError}</p>
        </div>
      ) : (
        <RelationshipManager rows={rows} teachers={teachers} students={students} />
      )}

      {!loadError && rows.length === 0 && (
        <div style={{ marginTop: 16 }}>
          <EmptyState title="No relationships." body="Assign a student to a teacher to begin." />
        </div>
      )}

      <FilteredPagination page={currentPage} total={total} pageSize={PAGE_SIZE} query={query} />
    </main>
  );
}

const primaryButton = { border: 0, borderRadius: 999, padding: "12px 18px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer", fontSize: 14 } as const;
