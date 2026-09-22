import { afterEach, describe, expect, it, vi } from "vitest";
import { embedTexts, generateGroundedTutor, validateTutorResult } from "./gemini";

const DIMS = 768;
const embeddingPayload = { embeddings: [{ values: Array.from({ length: DIMS }, (_, i) => i / DIMS) }] };

function mockFetchOnce(json: unknown, status = 200): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => json }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GEMINI_API_KEY;
});

describe("embedTexts", () => {
  it("sends batchEmbedContents and returns vectors", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    mockFetchOnce(embeddingPayload);
    const vectors = await embedTexts(["photosynthesis"]);
    expect(vectors).toHaveLength(1);
    expect(vectors[0]).toHaveLength(DIMS);
    const [calledUrl, options] = (fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0];
    expect(calledUrl).toContain("models/gemini-embedding-001:batchEmbedContents");
    expect(options.headers).toMatchObject({ "x-goog-api-key": "test-key" });
    expect(options.method).toBe("POST");
  });

  it("rejects wrong-dimension embeddings instead of storing them", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    mockFetchOnce({ embeddings: [{ values: [0.1, 0.2] }] });
    await expect(embedTexts(["x"])).rejects.toThrow("GEMINI_MALFORMED_RESPONSE");
  });

  it("maps rate limits distinctly", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    mockFetchOnce({ error: "quota" }, 429);
    await expect(embedTexts(["x"])).rejects.toThrow("GEMINI_RATE_LIMITED");
  });

  it("requires configuration before any network call", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    await expect(embedTexts(["x"])).rejects.toThrow("GEMINI_NOT_CONFIGURED");
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("generateGroundedTutor", () => {
  it("parses and validates the structured contract", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    mockFetchOnce({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  answer: "Mitochondria produce energy.",
                  grounded: true,
                  sources: [{ title: "Biology Ch 5", page: 12 }],
                  followups: ["What is ATP?"],
                }),
              },
            ],
          },
        },
      ],
    });
    const result = await generateGroundedTutor({ systemPrompt: "sys", userPrompt: "user" });
    expect(result.answer).toContain("Mitochondria");
    expect(result.grounded).toBe(true);
    expect(result.sources).toEqual([{ title: "Biology Ch 5", page: 12 }]);
  });

  it("rejects malformed model output instead of persisting it", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    mockFetchOnce({ candidates: [{ content: { parts: [{ text: "not json" }] } }] });
    await expect(generateGroundedTutor({ systemPrompt: "s", userPrompt: "u" })).rejects.toThrow(
      "GEMINI_MALFORMED_RESPONSE",
    );
  });
});

describe("validateTutorResult", () => {
  it("clamps oversized sources and followups", () => {
    const result = validateTutorResult({
      answer: "ok",
      grounded: false,
      sources: [{ title: "t" }, { title: 42, page: 1.6 }],
      followups: ["a", 7, "b", "c", "d", "e"],
    });
    expect(result.sources[1]).toEqual({ title: "Study material", page: 2 });
    expect(result.followups).toHaveLength(4);
  });
});
