"use client";

import { useId, useMemo, useState } from "react";
import { MATCH_PAIRS, buildMatchDeck, isMatch, performanceLabel, type LabCategory } from "@/lib/lab/questions";
import { countPlay } from "@/lib/lab/best";
import { ResultCard } from "./result-card";

// Concept Match: tap a term, tap its explanation. Gentle feedback only —
// matched pairs lock in with quiet confirmation, misses simply flip back.

const PAIR_COUNT = 6;

export function ConceptMatch({ category }: { category: LabCategory }) {
  // Hydration-safe seed: useId is stable across server and client renders;
  // restarts bump a counter (client-only transitions never mismatch).
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [restarts, setRestarts] = useState(0);
  const [firstKey, setFirstKey] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [misses, setMisses] = useState(0);
  const [moves, setMoves] = useState(0);
  // Start timestamp is set by the first tap (an event handler), never during
  // render — and it only feeds the done screen, which never server-renders.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);

  const pairs = useMemo(() => MATCH_PAIRS.filter((p) => p.category === category).slice(0, PAIR_COUNT), [category]);
  const deck = useMemo(() => buildMatchDeck(pairs, `${category}-${instanceId}-${restarts}`), [pairs, category, instanceId, restarts]);
  const done = matched.length === pairs.length && pairs.length > 0;

  function restart() {
    setRestarts((n) => n + 1);
    setFirstKey(null);
    setMatched([]);
    setMisses(0);
    setMoves(0);
    setFlash(null);
    countPlay();
  }

  function tap(key: string, at: number) {
    if (done) return;
    const card = deck.find((c) => c.key === key);
    if (!card || matched.includes(card.pairId)) return;
    setStartedAt((previous) => previous ?? at);
    if (firstKey === null) {
      setFirstKey(key);
      return;
    }
    if (firstKey === key) {
      setFirstKey(null);
      return;
    }
    const first = deck.find((c) => c.key === firstKey)!;
    setMoves((m) => m + 1);
    if (isMatch(first, card)) {
      const next = [...matched, card.pairId];
      const start = startedAt ?? at;
      setMatched(next);
      setFirstKey(null);
      setFlash(`Matched — ${next.length} of ${pairs.length}.`);
      if (next.length === pairs.length) {
        setElapsed(Math.max(1, Math.round((at - start) / 1000)));
      }
    } else {
      setMisses((m) => m + 1);
      setFlash("Not a pair — try again, no harm done.");
      setFirstKey(null);
    }
  }

  if (pairs.length === 0) return null;
  const accuracy = moves > 0 ? Math.round(((moves - misses) / moves) * 100) : null;

  if (done) {
    return (
      <ResultCard
        title="All concepts matched."
        correct={pairs.length - misses > 0 ? pairs.length : pairs.length}
        total={pairs.length}
        accuracy={accuracy}
        timeLabel={`${elapsed}s · ${moves} tries`}
        detail={misses === 0 ? "A perfect board — every match from understanding." : performanceLabel(accuracy)}
        bestLabel={null}
        onRetry={restart}
        programHref="/programs"
        programLabel="Like learning this way? Explore programs"
      />
    );
  }

  return (
    <div className="lab-match">
      <p className="lab-status" aria-live="polite">
        {flash ?? `Tap a term, then its explanation. ${matched.length} of ${pairs.length} matched.`}
      </p>
      <div className="lab-match-grid" role="group" aria-label="Match terms with explanations">
        {deck.map((card) => {
          const isMatched = matched.includes(card.pairId);
          const isFirst = firstKey === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={(event) => tap(card.key, event.timeStamp)}
              disabled={isMatched}
              aria-pressed={isFirst}
              aria-label={`${card.kind === "term" ? "Term" : "Explanation"}: ${card.text}${isMatched ? " (matched)" : ""}`}
              className={`lab-card${isMatched ? " is-matched" : ""}${isFirst ? " is-picked" : ""} is-${card.kind}`}
            >
              {card.text}
            </button>
          );
        })}
      </div>
      <p className="lab-hint">{moves} tries · {misses} misses</p>
    </div>
  );
}
