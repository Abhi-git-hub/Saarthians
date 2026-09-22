"use client";

import { useState } from "react";
import { MathSprint } from "./math-sprint";
import { ConceptMatch } from "./concept-match";
import { LogicDetective } from "./logic-detective";
import type { LabCategory } from "@/lib/lab/questions";

// Flagship interactive section: pick a way to think, play a short game,
// get honest feedback. No sign-up, no AI calls, no backend.
type Game = "sprint" | "match-science" | "match-english" | "detective";

const GAMES: Array<{ id: Game; tab: string; categories: LabCategory[]; title: string; blurb: string; time: string }> = [
  { id: "sprint", tab: "Math Sprint", categories: ["math"], title: "Math Sprint", blurb: "30 seconds of quick calculations. Speed with understanding — the exact muscle class tests use.", time: "30 sec" },
  { id: "match-science", tab: "Concept Match", categories: ["science"], title: "Concept Match · Science", blurb: "Match each term to its explanation. The way Saarthians teaches: terms first, then the why.", time: "2 min" },
  { id: "match-english", tab: "Word Match", categories: ["english"], title: "Concept Match · English", blurb: "Match precise words to their meanings. Vocabulary that actually sticks.", time: "2 min" },
  { id: "detective", tab: "Logic Detective", categories: ["logic"], title: "Logic Detective", blurb: "Five reasoning puzzles with a “Show me why” after every answer. Winning is optional; learning is not.", time: "3 min" },
];

export function LearningLab() {
  const [game, setGame] = useState<Game>("sprint");
  const active = GAMES.find((g) => g.id === game)!;

  return (
    <div className="lab-shell">
      <div className="lab-tabs" role="tablist" aria-label="Choose a game">
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            role="tab"
            aria-selected={game === g.id}
            onClick={() => setGame(g.id)}
            className={`lab-tab${game === g.id ? " is-active" : ""}`}
          >
            {g.tab}
          </button>
        ))}
      </div>
      <article className="lab-stage" aria-live="off">
        <header className="lab-stage-head">
          <div>
            <h3>{active.title}</h3>
            <p>{active.blurb}</p>
          </div>
          <span className="lab-time">{active.time}</span>
        </header>
        {game === "sprint" && <MathSprint key="sprint" />}
        {game === "match-science" && <ConceptMatch key="ms" category="science" />}
        {game === "match-english" && <ConceptMatch key="me" category="english" />}
        {game === "detective" && <LogicDetective key="det" />}
      </article>
    </div>
  );
}
