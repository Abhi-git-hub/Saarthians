import { describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimits } from "./rate-limit";

describe("checkRateLimit", () => {
  it("allows up to the limit then denies within the window", () => {
    resetRateLimits();
    expect(checkRateLimit("u1", 2, 60000, 1000).allowed).toBe(true);
    expect(checkRateLimit("u1", 2, 60000, 2000).allowed).toBe(true);
    const denied = checkRateLimit("u1", 2, 60000, 3000);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after the window and isolates keys", () => {
    resetRateLimits();
    expect(checkRateLimit("a", 1, 1000, 0).allowed).toBe(true);
    expect(checkRateLimit("a", 1, 1000, 500).allowed).toBe(false);
    expect(checkRateLimit("b", 1, 1000, 500).allowed).toBe(true);
    expect(checkRateLimit("a", 1, 1000, 1000).allowed).toBe(true);
  });
});
