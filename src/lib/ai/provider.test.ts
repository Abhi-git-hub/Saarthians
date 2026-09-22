import { describe, expect, it, vi } from "vitest";
import { generateWithProvider, isProviderConfigured } from "./provider";
import { generateGroundedTutor, isGeminiConfigured } from "./gemini";
import type { TutorContext } from "./types";

vi.mock("./gemini", () => ({
  generateGroundedTutor: vi.fn(),
  isGeminiConfigured: vi.fn(),
}));

const CONTEXT: TutorContext = {
  mistakes: [],
  notes: [],
  progress: { gradedAttempts: 0, averagePercent: null, bestPercent: null, perTest: [] },
  noteCount: 0,
};

describe("provider", () => {
  it("reports configuration honestly", () => {
    vi.mocked(isGeminiConfigured).mockReturnValue(false);
    expect(isProviderConfigured()).toBe(false);
  });

  it("refuses to generate without a key", async () => {
    vi.mocked(isGeminiConfigured).mockReturnValue(false);
    await expect(generateWithProvider({ kind: "help" }, CONTEXT)).rejects.toThrow("GEMINI_NOT_CONFIGURED");
  });

  it("labels grounded answers and appends real sources", async () => {
    vi.mocked(isGeminiConfigured).mockReturnValue(true);
    vi.mocked(generateGroundedTutor).mockResolvedValue({
      answer: "Mitochondria make energy.",
      grounded: true,
      sources: [{ title: "Biology Ch 5", page: 12 }],
      followups: ["What is ATP?"],
    });
    const result = await generateWithProvider({ kind: "explain_topic", topic: "cells" }, CONTEXT, [
      { chunkId: "c", materialId: "m", title: "Biology Ch 5", page: 12, text: "ev", distance: 0.1 },
    ]);
    expect(result.mode).toBe("gemini_grounded");
    expect(result.body).toContain("Source: Biology Ch 5 (page 12)");
    expect(result.suggestions).toEqual(["What is ATP?"]);
    expect(result.usedTools).toContain("material_retrieval");
  });

  it("marks general answers when no evidence was retrieved", async () => {
    vi.mocked(isGeminiConfigured).mockReturnValue(true);
    vi.mocked(generateGroundedTutor).mockResolvedValue({
      answer: "General answer.",
      grounded: false,
      sources: [],
      followups: [],
    });
    const result = await generateWithProvider({ kind: "help" }, CONTEXT, []);
    expect(result.mode).toBe("gemini_general");
    expect(result.usedTools).toEqual(["gemini_tutor"]);
  });
});
