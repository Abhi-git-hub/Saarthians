import { afterEach, describe, expect, it, vi } from "vitest";
import { generateGroundedTutor, groqChatModel, isGroqConfigured, stripFences, validateTutorResult } from "./groq";

function mockFetchOnce(json: unknown, status = 200): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => json }),
  );
}

function chatPayload(text: string) {
  return { choices: [{ message: { role: "assistant", content: text } }] };
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GROQ_API_KEY;
  delete process.env.GROQ_CHAT_MODEL;
  delete process.env.OPENAI_MODEL;
});

describe("provider configuration", () => {
  it("reads the key and honors model overrides", () => {
    expect(isGroqConfigured()).toBe(false);
    process.env.GROQ_API_KEY = "test-key";
    expect(isGroqConfigured()).toBe(true);
    expect(groqChatModel()).toBe("openai/gpt-oss-20b");
    process.env.OPENAI_MODEL = "openai/gpt-oss-120b";
    expect(groqChatModel()).toBe("openai/gpt-oss-120b");
    process.env.GROQ_CHAT_MODEL = "qwen/qwen3.8-27b";
    expect(groqChatModel()).toBe("qwen/qwen3.8-27b");
  });
});

describe("generateGroundedTutor", () => {
  it("sends Bearer auth and parses fenced JSON", async () => {
    process.env.GROQ_API_KEY = "test-key";
    mockFetchOnce(
      chatPayload('```json\n{"answer":"Mitochondria produce energy.","grounded":true,"sources":[{"title":"Biology Ch 5","page":12}],"followups":["What is ATP?"]}\n```'),
    );
    const result = await generateGroundedTutor({ systemPrompt: "sys", userPrompt: "user" });
    expect(result.answer).toContain("Mitochondria");
    expect(result.grounded).toBe(true);
    expect(result.sources).toEqual([{ title: "Biology Ch 5", page: 12 }]);
    const [calledUrl, options] = (fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0];
    expect(calledUrl).toContain("/chat/completions");
    expect(options.headers).toMatchObject({ Authorization: "Bearer test-key" });
    expect(JSON.stringify(options.body)).not.toContain("test-key");
  });

  it("rejects malformed model output instead of persisting it", async () => {
    process.env.GROQ_API_KEY = "test-key";
    mockFetchOnce(chatPayload("not json"));
    await expect(generateGroundedTutor({ systemPrompt: "s", userPrompt: "u" })).rejects.toThrow(
      "GROQ_MALFORMED_RESPONSE",
    );
  });

  it("maps rate limits distinctly and requires configuration first", async () => {
    process.env.GROQ_API_KEY = "test-key";
    mockFetchOnce({ error: "quota" }, 429);
    await expect(generateGroundedTutor({ systemPrompt: "s", userPrompt: "u" })).rejects.toThrow("GROQ_RATE_LIMITED");

    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    delete process.env.GROQ_API_KEY;
    await expect(generateGroundedTutor({ systemPrompt: "s", userPrompt: "u" })).rejects.toThrow(
      "GROQ_NOT_CONFIGURED",
    );
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("stripFences + validateTutorResult", () => {
  it("strips fences and clamps oversized fields", () => {
    expect(stripFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
    expect(stripFences('{"a":1}')).toBe('{"a":1}');
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
