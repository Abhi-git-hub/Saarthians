"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { performanceLabel } from "@/lib/lab/questions";
import { countPlay, readBest, writeBest } from "@/lib/lab/best";
import { ResultCard } from "./result-card";

// 30-second Math Sprint. Questions are generated from a seeded PRNG per run:
// operands are visible (they ARE the question); the answer is computed at
// check time and never stored in the DOM.

const SPRINT_SECONDS = 30;

export interface SprintQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
}

export function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickUniqueOffsets(random: () => number, count: number, max: number): number[] {
  const offsets = new Set<number>();
  while (offsets.size < count) {
    const candidate = 1 + Math.floor(random() * max);
    offsets.add(candidate);
  }
  return [...offsets];
}

export function generateSprintQuestion(random: () => number, round: number): SprintQuestion {
  const tier = Math.min(2, Math.floor(round / 4));
  const max = [12, 25, 60][tier];
  const kind = Math.floor(random() * (tier === 0 ? 2 : 4));
  let prompt: string;
  let answer: number;
  if (kind === 0) {
    const a = 2 + Math.floor(random() * max);
    const b = 2 + Math.floor(random() * max);
    prompt = `${a} + ${b} = ?`;
    answer = a + b;
  } else if (kind === 1) {
    const a = 3 + Math.floor(random() * max);
    const b = 2 + Math.floor(random() * Math.min(a - 1, max));
    prompt = `${a} − ${b} = ?`;
    answer = a - b;
  } else if (kind === 2) {
    const a = 2 + Math.floor(random() * 9);
    const b = 2 + Math.floor(random() * 9);
    prompt = `${a} × ${b} = ?`;
    answer = a * b;
  } else {
    const step = 2 + Math.floor(random() * 9);
    const start = step * (1 + Math.floor(random() * 9));
    prompt = `${start}, ${start + step}, ${start + 2 * step}, … next?`;
    answer = start + 3 * step;
  }
  const correctIndex = Math.floor(random() * 4);
  const offsets = pickUniqueOffsets(random, 3, Math.max(5, Math.abs(answer) >> 1 || 5));
  const options: string[] = [];
  let offset = 0;
  for (let i = 0; i < 4; i += 1) {
    if (i === correctIndex) options.push(String(answer));
    else options.push(String(answer + (random() < 0.5 ? -1 : 1) * offsets[offset++]));
  }
  return { prompt, options, correctIndex };
}

type Phase = "ready" | "playing" | "done";

export function MathSprint() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(SPRINT_SECONDS);
  const [best, setBest] = useState<number | null>(null);
  const [random, setRandom] = useState<() => number>(() => () => 0.5);
  const scoreRef = useRef(0);
  const busyRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  const question = useMemo(
    () => (phase === "ready" ? null : generateSprintQuestion(random, round)),
    [phase, round, random],
  );

  const start = useCallback(() => {
    scoreRef.current = 0;
    busyRef.current = false;
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    setRandom(() => mulberry32((Date.now() % 2147483647) || 7));
    setRound(0);
    setScore(0);
    setAnswered(0);
    setPicked(null);
    setSecondsLeft(SPRINT_SECONDS);
    setBest(readBest("math-sprint"));
    setPhase("playing");
    countPlay();
  }, []);

  // The clock ticks inside the interval callback (never setState in the
  // effect body): when time expires the same callback finalizes the run.
  useEffect(() => {
    if (phase !== "playing") return;
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      const left = Math.max(0, SPRINT_SECONDS - Math.floor((Date.now() - startedAt) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        window.clearInterval(id);
        setPhase("done");
        setBest(writeBest("math-sprint", scoreRef.current));
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
  }, []);

  const choose = useCallback(
    (index: number) => {
      // Ref guard (not state): two taps landing before the next render must
      // not double-count. Ref writes in handlers are always safe.
      if (phase !== "playing" || busyRef.current || !question) return;
      busyRef.current = true;
      setPicked(index);
      setAnswered((n) => n + 1);
      if (index === question.correctIndex) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        busyRef.current = false;
        setPicked(null);
        setRound((r) => r + 1);
      }, 650);
    },
    [phase, question],
  );

  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (event: KeyboardEvent) => {
      const index = ["1", "2", "3", "4"].indexOf(event.key);
      if (index >= 0) {
        event.preventDefault();
        choose(index);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, choose]);

  if (phase === "ready") {
    return (
      <div className="lab-game-intro">
        <p>30 seconds. Quick calculations that warm up the exact muscles class tests use — speed with understanding.</p>
        <button type="button" onClick={start} className="public-button public-button-primary">Start sprint →</button>
      </div>
    );
  }

  if (phase === "done" || secondsLeft <= 0) {
    const accuracy = answered > 0 ? Math.round((score / answered) * 100) : null;
    return (
      <ResultCard
        title="Sprint complete."
        correct={score}
        total={answered}
        accuracy={accuracy}
        timeLabel="30 seconds"
        detail={performanceLabel(accuracy)}
        bestLabel={best !== null ? `${best} in 30s on this device` : null}
        onRetry={start}
        programHref="/programs"
        programLabel="Want questions matched to your class? Explore programs"
      />
    );
  }

  return (
    <div className="lab-sprint">
      <div className="lab-hud" aria-hidden="true">
        <span className="lab-timer">{secondsLeft}s</span>
        <span className="lab-progress" role="presentation"><span style={{ width: `${(secondsLeft / SPRINT_SECONDS) * 100}%` }} /></span>
        <span>Q{answered + 1} · {score} correct</span>
      </div>
      <p className="lab-status" aria-live="polite">
        {picked === null ? `Question ${answered + 1}` : picked === question!.correctIndex ? "Correct — nice." : `Not quite — ${question!.options[question!.correctIndex]}.`}
      </p>
      <h3 className="lab-prompt">{question!.prompt}</h3>
      <div className="lab-options" role="group" aria-label="Answer choices. Press 1 to 4 on a keyboard.">
        {question!.options.map((option, i) => {
          const state =
            picked === null ? "" : i === question!.correctIndex ? " is-correct" : i === picked ? " is-wrong" : " is-dim";
          return (
            <button
              key={`${round}-${i}`}
              type="button"
              onClick={() => choose(i)}
              disabled={picked !== null}
              className={`lab-option${state}`}
              aria-label={`Option ${i + 1}: ${option}`}
            >
              <span className="lab-key" aria-hidden="true">{i + 1}</span>{option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
