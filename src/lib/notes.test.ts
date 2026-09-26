import { describe, expect, it } from "vitest";
import { escapeLikePattern, toFilterTerm } from "./notes";

describe("escapeLikePattern", () => {
  it("escapes LIKE wildcards literally", () => {
    expect(escapeLikePattern("100%_sure\\")).toBe("100\\%\\_sure\\\\");
    expect(escapeLikePattern("plain text")).toBe("plain text");
  });
});

describe("toFilterTerm", () => {
  it("wraps trimmed input as a LIKE pattern", () => {
    expect(toFilterTerm("  fractions  ")).toBe("%fractions%");
  });

  it("neutralizes PostgREST or() syntax breakers", () => {
    expect(toFilterTerm("a,b(c)")).toBe("%a b c%");
  });

  it("returns null when nothing searchable remains", () => {
    expect(toFilterTerm(undefined)).toBeNull();
    expect(toFilterTerm("   ")).toBeNull();
    expect(toFilterTerm(",,,")).toBeNull();
  });

  it("caps runaway input", () => {
    const pattern = toFilterTerm("x".repeat(500));
    expect(pattern).not.toBeNull();
    expect(pattern!.length).toBeLessThanOrEqual(122);
  });
});
