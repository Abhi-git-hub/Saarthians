import { describe, expect, it } from "vitest";
import { CURIOSITY_CATEGORIES, CURIOSITY_QUESTIONS } from "./curiosity";

describe("curiosity bank", () => {
  it("covers every category with complete, honest content", () => {
    for (const category of ["math", "science", "logic", "english"] as const) {
      expect(CURIOSITY_QUESTIONS.filter((q) => q.category === category).length).toBeGreaterThanOrEqual(2);
    }
    const ids = new Set<string>();
    for (const q of CURIOSITY_QUESTIONS) {
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);
      expect(q.question.trim().length).toBeGreaterThan(10);
      expect(q.answer.trim().length).toBeGreaterThan(40);
      expect(q.whyItSticks.trim().length).toBeGreaterThan(5);
      expect(q.gradeRange.trim().length).toBeGreaterThan(0);
    }
    const blob = JSON.stringify(CURIOSITY_QUESTIONS).toLowerCase();
    for (const banned of ["placeholder", "lorem", "iq", "genius"]) {
      expect(blob).not.toContain(banned);
    }
  });

  it("exposes a filter for every bank category", () => {
    const filterIds = CURIOSITY_CATEGORIES.map((c) => c.id);
    for (const q of CURIOSITY_QUESTIONS) {
      expect(filterIds).toContain(q.category);
    }
  });
});
