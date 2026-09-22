"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { QUESTION_BANK, dailyQuestion } from "@/lib/lab/questions";

// One question, same for every visitor on the same UTC day. Purely local:
// no backend, no tracking — played-state lives on this device only.
//
// Hydration: the date and the played flag come from useSyncExternalStore,
// whose server snapshot is fixed. React reconciles the client values after
// hydration by design — no mismatch errors, even across UTC midnight or a
// day-old prerender.

const SERVER_SNAPSHOT_DATE = "2026-09-22T00:00:00.000Z";

function subscribeDay(notify: () => void): () => void {
  const id = window.setInterval(notify, 60000);
  return () => window.clearInterval(id);
}

function playedKey(dateISO: string): string {
  return `saarthians-lab-daily:${dateISO.slice(0, 10)}`;
}

export function DailyChallenge() {
  const [picked, setPicked] = useState<number | null>(null);
  const dateISO = useSyncExternalStore(subscribeDay, () => new Date().toISOString(), () => SERVER_SNAPSHOT_DATE);
  const question = useMemo(() => dailyQuestion(QUESTION_BANK, dateISO), [dateISO]);
  const wasPlayed = useSyncExternalStore(
    (notify) => {
      window.addEventListener("storage", notify);
      return () => window.removeEventListener("storage", notify);
    },
    () => {
      try {
        return window.localStorage.getItem(playedKey(dateISO)) === "1";
      } catch {
        return false;
      }
    },
    () => false,
  );

  function choose(index: number) {
    if (picked !== null) return;
    setPicked(index);
    try {
      window.localStorage.setItem(playedKey(dateISO), "1");
    } catch {
      // Ignore.
    }
  }

  const answered = picked !== null;

  return (
    <div className="lab-daily">
      <div className="lab-daily-head">
        <span className="eyebrow">Today&apos;s challenge</span>
        <span className="lab-date">
          {new Date(`${dateISO.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
        </span>
      </div>
      <h3 className="lab-prompt">{question.prompt}</h3>
      <p className="lab-skill">
        {question.skill} · {question.gradeRange}
        {wasPlayed && !answered ? " · you tried this earlier — one more look?" : ""}
      </p>
      <div className="lab-options" role="group" aria-label="Answer choices">
        {question.options.map((option, i) => {
          const state = !answered
            ? ""
            : i === question.correctIndex
              ? " is-correct"
              : i === picked
                ? " is-wrong"
                : " is-dim";
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              disabled={answered}
              className={`lab-option${state}`}
              aria-label={`Option ${i + 1}: ${option}`}
            >
              <span className="lab-key" aria-hidden="true">{String.fromCharCode(65 + i)}</span>{option}
            </button>
          );
        })}
      </div>
      <p className="lab-status" aria-live="polite">
        {answered
          ? picked === question.correctIndex
            ? "Correct. Same question for every visitor today — you solved what the whole city is solving."
            : `Not quite — ${question.options[question.correctIndex]}. ${question.explanation}`
          : "One question. Everyone gets this one today."}
      </p>
      {answered && picked !== question.correctIndex && (
        <p className="lab-explain">{question.explanation}</p>
      )}
      {answered && (
        <Link href="/programs" className="text-link-big">Want questions matched to your class? →</Link>
      )}
    </div>
  );
}
