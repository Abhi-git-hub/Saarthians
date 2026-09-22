"use client";

import { useMemo, useState } from "react";
import { QUESTION_BANK, performanceLabel, scoreQuiz } from "@/lib/lab/questions";
import { countPlay } from "@/lib/lab/best";
import { ResultCard } from "./result-card";

// Logic Detective: a short sequence of reasoning puzzles. Every answer —
// right or wrong — ends with "Show me why", because the objective is
// "I learned something", not just winning.

const PUZZLE_COUNT = 5;

export function LogicDetective() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState(false);

  // Fixed pedagogical order (easy → hard): identical on server and client,
  // so hydration always matches. Restarting replays the same case file.
  const puzzles = useMemo(
    () =>
      [...QUESTION_BANK]
        .filter((q) => q.category === "logic")
        .sort((a, b) => a.difficulty - b.difficulty || (a.id < b.id ? -1 : 1))
        .slice(0, PUZZLE_COUNT),
    [],
  );
  const puzzle = puzzles[index];
  const done = index >= puzzles.length;

  function restart() {
    setIndex(0);
    setAnswers({});
    setRevealed(false);
    countPlay();
  }

  function choose(option: number) {
    if (!puzzle || answers[puzzle.id] !== undefined) return;
    setAnswers((a) => ({ ...a, [puzzle.id]: option }));
    setRevealed(false);
  }

  function next() {
    setIndex((i) => i + 1);
    setRevealed(false);
  }

  if (!done && !puzzle) return null;

  if (done) {
    const report = scoreQuiz(puzzles, answers);
    return (
      <ResultCard
        title="Case closed."
        correct={report.correct}
        total={report.total}
        accuracy={report.accuracy}
        timeLabel="At your pace"
        detail={performanceLabel(report.accuracy)}
        bestLabel={null}
        onRetry={restart}
        programHref="/programs"
        programLabel="Reason like this daily? Explore programs"
      />
    );
  }

  const picked = answers[puzzle.id];
  const answered = picked !== undefined;

  return (
    <div className="lab-detective">
      <p className="lab-status" aria-live="polite">
        Puzzle {index + 1} of {puzzles.length} · {puzzle.skill}
      </p>
      <h3 className="lab-prompt">{puzzle.prompt}</h3>
      <div className="lab-options" role="group" aria-label="Answer choices">
        {puzzle.options.map((option, i) => {
          const state = !answered
            ? ""
            : i === puzzle.correctIndex
              ? " is-correct"
              : i === picked
                ? " is-wrong"
                : " is-dim";
          return (
            <button
              key={puzzle.id + i}
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
      {answered && (
        <div className="lab-why">
          <p className={picked === puzzle.correctIndex ? "lab-verdict-good" : "lab-verdict-bad"}>
            {picked === puzzle.correctIndex ? "Correct deduction." : `The trail led to “${puzzle.options[puzzle.correctIndex]}”.`}
          </p>
          {!revealed ? (
            <button type="button" onClick={() => setRevealed(true)} className="public-button public-button-secondary">
              Show me why →
            </button>
          ) : (
            <p className="lab-explain">{puzzle.explanation}</p>
          )}
          <div>
            <button type="button" onClick={next} className="public-button public-button-primary">
              {index + 1 === puzzles.length ? "See result →" : "Next puzzle →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
