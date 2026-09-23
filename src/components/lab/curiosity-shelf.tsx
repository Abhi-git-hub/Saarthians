"use client";

import { useState } from "react";
import Link from "next/link";
import { CURIOSITY_CATEGORIES, CURIOSITY_QUESTIONS, type CuriosityCategory } from "@/lib/lab/curiosity";

// The curiosity shelf: interesting questions, honestly answered. No scores,
// no timers, no winners — open a question, think, reveal. Native <details>
// elements keep it robust: keyboard accessible, SSR-safe, zero state bugs.
export function CuriosityShelf() {
  const [filter, setFilter] = useState<CuriosityCategory | "all">("all");
  const visible =
    filter === "all" ? CURIOSITY_QUESTIONS : CURIOSITY_QUESTIONS.filter((q) => q.category === filter);

  return (
    <div className="curio-shell">
      <div className="curio-filters" role="group" aria-label="Filter questions by subject">
        {CURIOSITY_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            aria-pressed={filter === c.id}
            className={`lab-tab${filter === c.id ? " is-active" : ""}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="curio-list">
        {visible.map((q) => (
          <details key={q.id} className="curio" name="curiosity">
            <summary>
              <span className="curio-tags">
                <i>{q.category}</i>
                <em>{q.gradeRange}</em>
              </span>
              <strong>{q.question}</strong>
            </summary>
            <div className="curio-answer">
              <p>{q.answer}</p>
              <p className="curio-stick">{q.whyItSticks}</p>
            </div>
          </details>
        ))}
      </div>
      <p className="curio-foot">
        Like thinking this way? <Link href="/programs">See how Saarthians teaches →</Link>
      </p>
    </div>
  );
}
