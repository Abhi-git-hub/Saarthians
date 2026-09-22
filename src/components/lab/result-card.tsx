"use client";

import Link from "next/link";

// Shared end-screen for every Learning Lab game: honest numbers, a program
// CTA, and a replay CTA. Never a signup wall, never pseudo-scientific claims.
export function ResultCard({
  title,
  correct,
  total,
  accuracy,
  timeLabel,
  detail,
  bestLabel,
  onRetry,
  programHref,
  programLabel,
}: {
  title: string;
  correct: number;
  total: number;
  accuracy: number | null;
  timeLabel: string;
  detail: string;
  bestLabel?: string | null;
  onRetry: () => void;
  programHref: string;
  programLabel: string;
}) {
  return (
    <div className="lab-result" role="status">
      <span className="eyebrow">Your result</span>
      <h3>{title}</h3>
      <p className="lab-score">
        {correct} <span>/ {total} correct</span>
      </p>
      <dl className="lab-stats">
        <div><dt>Accuracy</dt><dd>{accuracy === null ? "—" : `${accuracy}%`}</dd></div>
        <div><dt>Time</dt><dd>{timeLabel}</dd></div>
        {bestLabel && <div><dt>Best here</dt><dd>{bestLabel}</dd></div>}
      </dl>
      <p className="lab-detail">{detail}</p>
      <div className="lab-ctas">
        <Link href={programHref} className="public-button public-button-primary">{programLabel} →</Link>
        <button type="button" onClick={onRetry} className="public-button public-button-secondary">Try another →</button>
      </div>
      <p className="lab-note">Just a taste on this device — Saarthians tracks real progress inside the student workspace.</p>
    </div>
  );
}
