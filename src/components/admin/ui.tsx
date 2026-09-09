import Link from "next/link";

// Shared presentational pieces for the admin console. No data fetching here;
// pages fetch server-side and pass plain props.

export const cardStyle = {
  border: "1px solid var(--line)",
  borderRadius: 18,
  padding: 22,
  background: "white",
} as const;

export function PageHeader({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string }) {
  return (
    <div>
      <span className="eyebrow">{eyebrow}</span>
      <h1 style={{ fontSize: "clamp(34px,5vw,56px)", lineHeight: 0.98, letterSpacing: "-.05em", margin: "16px 0 10px" }}>
        {title}
      </h1>
      {lede && <p style={{ color: "var(--muted)", maxWidth: 680, lineHeight: 1.65, margin: 0 }}>{lede}</p>}
    </div>
  );
}

export function StatCard({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <>
      <span className="eyebrow">{label}</span>
      <strong style={{ display: "block", fontSize: 34, marginTop: 12, letterSpacing: "-.05em" }}>{value}</strong>
    </>
  );
  return href ? (
    <Link href={href} style={cardStyle}>
      {body}
    </Link>
  ) : (
    <article style={cardStyle}>{body}</article>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const palette: Record<string, { bg: string; fg: string }> = {
    active: { bg: "#e3f2e4", fg: "#1d5c34" },
    pending: { bg: "#fdf1d7", fg: "#8a5a00" },
    suspended: { bg: "#fbe3e3", fg: "#933" },
    published: { bg: "#e3f2e4", fg: "#1d5c34" },
    draft: { bg: "#eef0ea", fg: "#5b6472" },
    archived: { bg: "#eef0ea", fg: "#5b6472" },
    graded: { bg: "#e3f2e4", fg: "#1d5c34" },
    reviewed: { bg: "#e3f2e4", fg: "#1d5c34" },
  };
  const colors = palette[status] ?? { bg: "#eef0ea", fg: "#5b6472" };
  return (
    <span
      style={{
        display: "inline-block",
        background: colors.bg,
        color: colors.fg,
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 750,
        textTransform: "uppercase",
        letterSpacing: ".06em",
      }}
    >
      {status}
    </span>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ ...cardStyle, color: "var(--muted)" }}>
      <strong style={{ color: "var(--ink)", display: "block", marginBottom: 6 }}>{title}</strong>
      {body}
    </div>
  );
}

export function FilteredPagination({
  page,
  total,
  pageSize,
  query,
}: {
  page: number;
  total: number;
  pageSize: number;
  query: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (p: number) => `?${query}${query ? "&" : ""}page=${p}`;
  return (
    <nav aria-label="Pagination" style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 20 }}>
      {page > 1 && (
        <Link href={href(page - 1)} style={pagerStyle}>
          ← Previous
        </Link>
      )}
      <span style={{ color: "var(--muted)", fontSize: 13 }}>
        Page {page} of {pages} · {total} total
      </span>
      {page < pages && (
        <Link href={href(page + 1)} style={pagerStyle}>
          Next →
        </Link>
      )}
    </nav>
  );
}

const pagerStyle = {
  border: "1px solid var(--line)",
  borderRadius: 999,
  padding: "8px 14px",
  background: "white",
  fontSize: 13,
  fontWeight: 700,
} as const;

export const fieldStyle = {
  width: "100%",
  border: "1px solid var(--line)",
  borderRadius: 12,
  padding: "11px 12px",
  background: "white",
  color: "var(--ink)",
  font: "inherit",
  boxSizing: "border-box",
} as const;

export const buttonStyle = {
  border: 0,
  borderRadius: 999,
  padding: "12px 18px",
  background: "var(--accent)",
  color: "white",
  fontWeight: 750,
  cursor: "pointer",
} as const;
