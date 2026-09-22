import { describe, expect, it } from "vitest";
import {
  MATCH_PAIRS,
  QUESTION_BANK,
  buildMatchDeck,
  dailyQuestion,
  isMatch,
  performanceLabel,
  pickQuestions,
  scoreQuiz,
  shuffled,
} from "./questions";

describe("shuffled", () => {
  it("is deterministic per seed and preserves all items", () => {
    const a = shuffled([1, 2, 3, 4, 5, 6], "seed-a");
    const b = shuffled([1, 2, 3, 4, 5, 6], "seed-a");
    const c = shuffled([1, 2, 3, 4, 5, 6], "seed-b");
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(a).not.toEqual(c);
  });
});

describe("question bank integrity", () => {
  it("has balanced categories with valid answers", () => {
    for (const category of ["math", "science", "logic", "english"] as const) {
      const group = QUESTION_BANK.filter((q) => q.category === category);
      expect(group.length).toBeGreaterThanOrEqual(8);
    }
    const ids = new Set<string>();
    for (const q of QUESTION_BANK) {
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);
      expect(q.options).toHaveLength(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThanOrEqual(3);
      expect(q.options[q.correctIndex].length).toBeGreaterThan(0);
      expect(q.explanation.length).toBeGreaterThan(10);
      expect(q.options[new Set(q.options).size === 4 ? q.correctIndex : 0]).toBeDefined();
    }
    // Options must be unique within each question.
    for (const q of QUESTION_BANK) {
      expect(new Set(q.options).size).toBe(4);
    }
    // No placeholder content may ship.
    const blob = JSON.stringify(QUESTION_BANK);
    expect(blob.toLowerCase()).not.toContain("placeholder");
    expect(blob.toLowerCase()).not.toContain("lorem");
  });

  it("has complete match pairs without placeholders", () => {
    expect(MATCH_PAIRS.length).toBeGreaterThanOrEqual(12);
    for (const pair of MATCH_PAIRS) {
      expect(pair.term.length).toBeGreaterThan(1);
      expect(pair.match.length).toBeGreaterThan(10);
    }
    const blob = JSON.stringify(MATCH_PAIRS).toLowerCase();
    expect(blob).not.toContain("placeholder");
  });
});

describe("pickQuestions", () => {
  it("filters by category and caps counts deterministically", () => {
    const first = pickQuestions(QUESTION_BANK, { category: "math", count: 4, seed: "x" });
    expect(first).toHaveLength(4);
    expect(first.every((q) => q.category === "math")).toBe(true);
    const again = pickQuestions(QUESTION_BANK, { category: "math", count: 4, seed: "x" });
    expect(again.map((q) => q.id)).toEqual(first.map((q) => q.id));
  });
});

describe("scoreQuiz", () => {
  it("scores answers and reports breakdowns", () => {
    const questions = pickQuestions(QUESTION_BANK, { count: 4, seed: "s" });
    const answers: Record<string, number> = {};
    questions.forEach((q, i) => {
      answers[q.id] = i < 2 ? q.correctIndex : (q.correctIndex + 1) % 4;
    });
    const report = scoreQuiz(questions, answers);
    expect(report.correct).toBe(2);
    expect(report.total).toBe(4);
    expect(report.accuracy).toBe(50);
    expect(report.breakdown.filter((b) => b.correct)).toHaveLength(2);
  });

  it("handles empty quizzes honestly", () => {
    expect(scoreQuiz([], {}).accuracy).toBeNull();
  });
});

describe("performanceLabel", () => {
  it("never makes pseudo-scientific claims", () => {
    for (const accuracy of [null, 100, 85, 60, 35, 0]) {
      const label = performanceLabel(accuracy).toLowerCase();
      expect(label).not.toContain("iq");
      expect(label).not.toContain("genius");
      expect(label).not.toContain("diagnos");
    }
    expect(performanceLabel(90)).toContain("Strong");
  });
});

describe("dailyQuestion", () => {
  it("is stable within a day and varies across days", () => {
    const a = dailyQuestion(QUESTION_BANK, "2026-09-22T05:00:00Z");
    const b = dailyQuestion(QUESTION_BANK, "2026-09-22T23:59:59Z");
    expect(a.id).toBe(b.id);
    const surrounding = new Set(
      ["2026-09-20", "2026-09-21", "2026-09-23", "2026-09-24", "2026-12-31", "2027-01-01"].map(
        (d) => dailyQuestion(QUESTION_BANK, `${d}T12:00:00Z`).id,
      ),
    );
    expect(surrounding.size).toBeGreaterThan(1);
  });
});

describe("match deck", () => {
  it("builds complete decks and validates matches", () => {
    const science = MATCH_PAIRS.filter((p) => p.category === "science");
    const deck = buildMatchDeck(science, "deck");
    expect(deck).toHaveLength(science.length * 2);
    const term = deck.find((c) => c.pairId === "p1" && c.kind === "term")!;
    const def = deck.find((c) => c.pairId === "p1" && c.kind === "match")!;
    const other = deck.find((c) => c.pairId === "p2" && c.kind === "match")!;
    expect(isMatch(term, def)).toBe(true);
    expect(isMatch(term, other)).toBe(false);
    expect(isMatch(term, term)).toBe(false);
  });
});
