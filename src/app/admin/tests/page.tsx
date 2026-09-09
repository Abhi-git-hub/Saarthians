import Link from "next/link";
import { listAdminTests } from "@/lib/admin";
import { adminErrorMessage } from "@/lib/admin-validation";
import { EmptyState, FilteredPagination, PageHeader, StatusBadge, cardStyle, fieldStyle } from "@/components/admin/ui";
import { PAGE_SIZE } from "@/lib/admin-validation";

const statuses = ["draft", "published", "archived"];

export default async function AdminTestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" && statuses.includes(params.status.trim()) ? params.status.trim() : "";
  const search = typeof params.search === "string" ? params.search.trim().slice(0, 120) : "";
  const page = Math.max(1, Number(params.page) || 1);
  const query = new URLSearchParams({ ...(status ? { status } : {}), ...(search ? { search } : {}) }).toString();

  let rows: Awaited<ReturnType<typeof listAdminTests>>["rows"] = [];
  let total = 0;
  let currentPage = page;
  let loadError: string | null = null;

  try {
    const result = await listAdminTests({ status: status || null, search: search || null, page });
    rows = result.rows;
    total = result.total;
    currentPage = result.page;
  } catch (error) {
    loadError = adminErrorMessage(error);
  }

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <PageHeader
        eyebrow="Assessments"
        title="Every test."
        lede="Administrative visibility into tests, creators, publishing state, and attempt volume. Authoring stays with teachers — this view is read-only."
      />

      <form method="get" style={{ ...cardStyle, marginTop: 28, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, alignItems: "end" }}>
        <label style={labelStyle}>
          Search
          <input name="search" defaultValue={search} placeholder="Test title…" maxLength={120} style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          Status
          <select name="status" defaultValue={status} style={fieldStyle}>
            <option value="">All statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <div><button type="submit" style={primaryButton}>Apply</button></div>
      </form>

      {loadError ? (
        <div role="alert" style={{ ...cardStyle, marginTop: 16, borderColor: "#e5b4b4", background: "#fdf3f3" }}>
          <strong>Could not load tests.</strong>
          <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>{loadError}</p>
        </div>
      ) : rows.length === 0 ? (
        <div style={{ marginTop: 16 }}><EmptyState title="No tests found." body="Adjust filters or wait for teachers to create assessments." /></div>
      ) : (
        <section style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {rows.map((test) => (
            <article key={test.id} style={{ ...cardStyle, display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center" }}>
              <div>
                <strong style={{ fontSize: 17 }}>{test.title}</strong>
                <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
                  by <Link href={`/admin/users/${test.teacher_id}`} style={{ textDecoration: "underline" }}>{test.teacher_name || "unknown teacher"}</Link>
                  {" "}· {test.question_count} questions · {test.attempt_count} attempts · created {new Date(test.created_at).toLocaleDateString()}
                </div>
              </div>
              <StatusBadge status={test.status} />
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
