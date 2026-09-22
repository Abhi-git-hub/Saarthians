import { describe, expect, it } from "vitest";
import { generateSprintQuestion, mulberry32 } from "@/components/lab/math-sprint";

describe("generateSprintQuestion", () => {
  it("produces unique options containing the answer exactly once", () => {
    const random = mulberry32(42);
    for (let round = 0; round < 40; round += 1) {
      const q = generateSprintQuestion(random, round);
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options.filter((o) => o === q.options[q.correctIndex])).toHaveLength(1);
      expect(q.prompt.length).toBeGreaterThan(3);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThanOrEqual(3);
    }
  });

  it("ramps difficulty and stays deterministic per seed", () => {
    const a = generateSprintQuestion(mulberry32(7), 0);
    const b = generateSprintQuestion(mulberry32(7), 0);
    expect(a).toEqual(b);
  });
});
