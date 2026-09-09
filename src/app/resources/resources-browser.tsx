"use client";

import { useMemo, useState } from "react";

export type Resource = {
  category: string;
  title: string;
  body: string;
  meta: string;
  href: string;
  external?: boolean;
};

const categories = ["All", "Study method", "Ask us", "Workspace", "Trust"];

export function ResourcesBrowser({ resources }: { resources: Resource[] }) {
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter(
      (r) =>
        (active === "All" || r.category === active) &&
        (!q || `${r.title} ${r.body}`.toLowerCase().includes(q)),
    );
  }, [resources, active, query]);

  return (
    <div>
      <div className="resource-filters" role="search">
        <input
          className="search-input resource-search"
          type="search"
          aria-label="Search resources"
          placeholder="Search guides…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="chip-row" role="group" aria-label="Filter by category">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className="chip"
              aria-pressed={active === c}
              onClick={() => setActive(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="resource-grid">
        {filtered.map((r) => (
          <a
            key={r.title}
            className="feature-card lift"
            href={r.href}
            {...(r.external ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            <span>{r.category.toUpperCase()}</span>
            <h3>{r.title}</h3>
            <p>{r.body}</p>
            <small className="resource-meta">{r.meta} →</small>
          </a>
        ))}
      </div>
      {!filtered.length && (
        <p className="empty-inline" role="status">Nothing matches — try a different search, or ask us directly on WhatsApp.</p>
      )}
    </div>
  );
}
