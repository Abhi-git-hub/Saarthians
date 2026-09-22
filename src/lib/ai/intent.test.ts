import { describe, expect, it } from "vitest";
import { classifyIntent, topicKeywords } from "./intent";

describe("classifyIntent", () => {
  it("greets short hellos", () => {
    expect(classifyIntent("hello").kind).toBe("greet");
    expect(classifyIntent("namaste").kind).toBe("greet");
  });

  it("routes mistake language to review", () => {
    expect(classifyIntent("where did I go wrong in fractions?").kind).toBe("review_mistakes");
    expect(classifyIntent("show my missed questions").kind).toBe("review_mistakes");
  });

  it("routes planning language to revision plans", () => {
    expect(classifyIntent("make me a revision plan").kind).toBe("revision_plan");
    expect(classifyIntent("help me prepare for next week").kind).toBe("revision_plan");
  });

  it("routes progress language to summaries", () => {
    expect(classifyIntent("how am I doing?").kind).toBe("progress_summary");
    expect(classifyIntent("show my average").kind).toBe("progress_summary");
  });

  it("routes practice language to drills", () => {
    expect(classifyIntent("quiz me on algebra").kind).toBe("practice");
    expect(classifyIntent("give me a mock").kind).toBe("practice");
  });

  it("routes explanation requests with an extracted topic", () => {
    const result = classifyIntent("explain photosynthesis simply");
    expect(result.kind).toBe("explain_topic");
    if (result.kind === "explain_topic") expect(result.topic.length).toBeGreaterThan(0);
  });

  it("falls back to help for vague or empty input", () => {
    expect(classifyIntent("what can you do?").kind).toBe("help");
    expect(classifyIntent("explain").kind).toBe("help");
    expect(classifyIntent("asdf qwerty zxcv").kind).toBe("unknown");
  });
});

describe("topicKeywords", () => {
  it("drops stopwords and short tokens", () => {
    expect(topicKeywords("what is the meaning of photosynthesis")).toEqual(["meaning", "photosynthesis"]);
    expect(topicKeywords("a an of to")).toEqual([]);
  });
});
