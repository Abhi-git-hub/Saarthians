import Link from "next/link";
import type { ReactNode } from "react";

// Shared editorial primitives for the authenticated workspaces.
// Server components, zero client JS. Variants stay small on purpose —
// composition happens at the call site, not inside these components.

export function PageHeading({
  eyebrow,
  title,
  lede,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="page-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {lede && <p>{lede}</p>}
      </div>
      {action && <div className="page-head-action">{action}</div>}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  link,
}: {
  eyebrow: string;
  title: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {link && (
        <Link href={link.href} className="text-link">
          {link.label}
        </Link>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="empty-state-block">
      <strong>{title}</strong>
      <p>{body}</p>
      {action && (
        <Link href={action.href} className="text-link">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: "live" | "idle" | "warn" | "bad" | "info"; children: ReactNode }) {
  return <span className={`status-pill is-${tone}`}>{children}</span>;
}

export function LoadingState({ label, lines = 3 }: { label: string; lines?: number }) {
  return (
    <div className="loading-state" role="status" aria-label={label} aria-busy="true">
      <span className="loading-line title" aria-hidden="true" />
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="loading-line" aria-hidden="true" />
      ))}
      <span className="loading-label">{label}</span>
    </div>
  );
}

export function ErrorState({ title, body, retryHref }: { title: string; body: string; retryHref?: string }) {
  return (
    <div className="error-state-block" role="alert">
      <strong>{title}</strong>
      <p>{body}</p>
      {retryHref && (
        <Link href={retryHref} className="text-link">
          Try again →
        </Link>
      )}
    </div>
  );
}

export function ProgressBar({ value, max = 100, label }: { value: number; max?: number; label?: string }) {  const pct = Math.max(0, Math.min(100, (value / Math.max(max, 1)) * 100));
  return (
    <span
      className="progress-meter"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progress"}
    >
      <span style={{ width: `${pct}%` }} />
    </span>
  );
}
