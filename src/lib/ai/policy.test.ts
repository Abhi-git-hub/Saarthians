import { describe, expect, it } from "vitest";
import { MAX_ANSWER_CHARS, MAX_MESSAGES_PER_DAY, chatMessageSchema } from "./policy";

describe("chat policy constants", () => {
  it("enforces a real daily budget", () => {
    expect(MAX_MESSAGES_PER_DAY).toBeGreaterThan(0);
    expect(MAX_MESSAGES_PER_DAY).toBeLessThanOrEqual(100);
  });

  it("caps answer length", () => {
    expect(MAX_ANSWER_CHARS).toBeGreaterThan(500);
  });
});

describe("chatMessageSchema", () => {
  it("accepts a valid message with or without conversation", () => {
    expect(chatMessageSchema.safeParse({ conversationId: null, content: "hello" }).success).toBe(true);
    expect(
      chatMessageSchema.safeParse({ conversationId: "00000000-0000-4000-8000-000000000000", content: "hi" }).success,
    ).toBe(true);
  });

  it("rejects empty, oversized, and malformed input", () => {
    expect(chatMessageSchema.safeParse({ conversationId: null, content: "   " }).success).toBe(false);
    expect(chatMessageSchema.safeParse({ conversationId: null, content: "x".repeat(2001) }).success).toBe(false);
    expect(chatMessageSchema.safeParse({ conversationId: "nope", content: "hi" }).success).toBe(false);
  });
});
