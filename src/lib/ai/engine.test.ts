import { describe, expect, it } from "vitest";
import { respondToIntent } from "./engine";
import type { TutorContext } from "./types";

const mistakeContext: TutorContext = {
  mistakes: [
    {
      testId: "test-1",
      testTitle: "Fractions Quiz",
      questionId: "q-1",
      prompt: "What is 1/2 + 1/4?",
      points: 2,
      studentAnswer: "1/3",
      correctAnswer: "3/4",
      feedback: "Add denominators first.",
      submittedAt: "2026-09-01T10:00:00Z",
    },
    {
      testId: "test-1",
      testTitle: "Fractions Quiz",
      questionId: "q-2",
      prompt: "What is 3/4 - 1/8?",
      points: 2,
      studentAnswer: "2/4",
      correctAnswer: "5/8",
      feedback: null,
      submittedAt: "2026-09-01T10:00:00Z",
    },
  ],
  notes: [{ id: "n-1", title: "Fractions summary", excerpt: "LCD method explained", updatedAt: "2026-09-02T10:00:00Z" }],
  progress: {
    gradedAttempts: 2,
    averagePercent: 50,
    bestPercent: 75,
    perTest: [{ testId: "test-1", title: "Fractions Quiz", attempts: 2, latestPercent: 50, bestPercent: 75 }],
  },
  noteCount: 1,
};

const emptyContext: TutorContext = {
  mistakes: [],
  notes: [],
  progress: { gradedAttempts: 0, averagePercent: null, bestPercent: null, perTest: [] },
  noteCount: 0,
};

describe("tutor engine grounding", () => {
  it("reviews only the mistakes present in context", () => {
    const answer = respondToIntent({ kind: "review_mistakes" }, mistakeContext);
    expect(answer.body).toContain("1/2 + 1/4?");
    expect(answer.body).toContain("1/3");
    expect(answer.body).toContain("3/4");
    expect(answer.body).not.toContain("photosynthesis");
    expect(answer.usedTools).toContain("review_mistakes");
  });

  it("is honest when there is nothing to review", () => {
    const answer = respondToIntent({ kind: "review_mistakes" }, emptyContext);
    expect(answer.body).toMatch(/nothing to review|graded assessment/i);
  });

  it("builds revision plans from real weak areas, ordered by misses", () => {
    const answer = respondToIntent({ kind: "revision_plan" }, mistakeContext);
    expect(answer.body).toContain("Fractions Quiz");
    expect(answer.body).toMatch(/step 1/i);
  });

  it("refuses to invent progress without graded work", () => {
    const answer = respondToIntent({ kind: "progress_summary" }, emptyContext);
    expect(answer.body).toMatch(/no graded work/i);
    expect(answer.body).not.toMatch(/\d+%/);
  });

  it("summarizes only real progress numbers", () => {
    const answer = respondToIntent({ kind: "progress_summary" }, mistakeContext);
    expect(answer.body).toContain("50%");
    expect(answer.body).toContain("75%");
  });

  it("explains only from the student's own notes, never invented facts", () => {
    const withNotes = respondToIntent({ kind: "explain_topic", topic: "fractions" }, mistakeContext);
    expect(withNotes.body).toContain("Fractions summary");
    const withoutNotes = respondToIntent({ kind: "explain_topic", topic: "fractions" }, emptyContext);
    expect(withoutNotes.body).toMatch(/don't have any notes|write a note/i);
  });

  it("builds practice only from real misses", () => {
    const answer = respondToIntent({ kind: "practice" }, mistakeContext);
    expect(answer.body).toContain("3/4 - 1/8?");
    expect(respondToIntent({ kind: "practice" }, emptyContext).body).toMatch(/attempt a test/i);
  });

  it("never emits an empty body and always suggests next steps", () => {
    for (const intent of [
      { kind: "greet" },
      { kind: "help" },
      { kind: "unknown" },
    ] as const) {
      const answer = respondToIntent(intent, emptyContext);
      expect(answer.body.trim().length).toBeGreaterThan(0);
      expect(answer.suggestions.length).toBeGreaterThan(0);
    }
  });
});
