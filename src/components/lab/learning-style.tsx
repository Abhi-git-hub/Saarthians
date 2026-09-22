"use client";

import { useState } from "react";
import Link from "next/link";

// Playful preference picker — explicitly NOT a psychological assessment.
// Just helps the visitor notice how they like to start.
const STYLES = [
  { id: "see", label: "SEE IT", blurb: "Diagrams, worked examples, watching a concept unfold.", result: "You like to SEE IT first — start with Concept Match and watch ideas click into place." },
  { id: "solve", label: "SOLVE IT", blurb: "Jump in, attempt, learn from the miss.", result: "You like to SOLVE IT — Math Sprint is your warm-up; mistakes are data." },
  { id: "explain", label: "EXPLAIN IT", blurb: "Understand the why deeply enough to teach it.", result: "You like to EXPLAIN IT — Logic Detective's “Show me why” was built for you." },
  { id: "practice", label: "PRACTICE IT", blurb: "Steady reps until it feels obvious.", result: "You like to PRACTICE IT — the Daily Challenge gives you one honest rep every day." },
] as const;

export function LearningStyle() {
  const [picked, setPicked] = useState<(typeof STYLES)[number] | null>(null);

  return (
    <div className="lab-style">
      <h3>How do you like to learn?</h3>
      <p className="lab-style-sub">Not a test, not a diagnosis — just a playful pointer to your next game.</p>
      <div className="lab-style-grid" role="group" aria-label="Learning preference choices">
        {STYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => setPicked(style)}
            aria-pressed={picked?.id === style.id}
            className={`lab-style-card${picked?.id === style.id ? " is-picked" : ""}`}
          >
            <strong>{style.label}</strong>
            <span>{style.blurb}</span>
          </button>
        ))}
      </div>
      {picked && (
        <p className="lab-status" aria-live="polite">
          {picked.result} <Link href="/programs">Explore programs →</Link>
        </p>
      )}
    </div>
  );
}
