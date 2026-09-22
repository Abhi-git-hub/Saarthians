import { describe, expect, it } from "vitest";
import {
  attemptStateLabel,
  lifecycleLabel,
  resolveAttemptState,
  resolveTestLifecycle,
} from "./assessment";

describe("resolveTestLifecycle", () => {
  const START = "2026-09-01T10:00:00Z";
  const END = "2026-09-01T11:00:00Z";

  it("derives scheduled/live/closed from the window", () => {
    expect(resolveTestLifecycle("published", START, END, Date.parse("2026-09-01T09:00:00Z"))).toBe("scheduled");
    expect(resolveTestLifecycle("published", START, END, Date.parse("2026-09-01T10:30:00Z"))).toBe("live");
    expect(resolveTestLifecycle("published", START, END, Date.parse("2026-09-01T11:00:00Z"))).toBe("closed");
  });

  it("keeps drafts and archived tests out of the live set", () => {
    expect(resolveTestLifecycle("draft", null, null)).toBe("draft");
    expect(resolveTestLifecycle("draft", START, END, Date.parse("2026-09-01T10:30:00Z"))).toBe("draft");
    expect(resolveTestLifecycle("archived", null, null)).toBe("archived");
  });

  it("treats open-ended published tests as live", () => {
    expect(resolveTestLifecycle("published", null, null)).toBe("live");
    expect(resolveTestLifecycle("published", null, END, Date.parse("2026-09-01T10:30:00Z"))).toBe("live");
  });

  it("labels every lifecycle", () => {
    for (const lifecycle of ["draft", "scheduled", "live", "closed", "archived"] as const) {
      expect(lifecycleLabel(lifecycle).length).toBeGreaterThan(0);
    }
  });
});

describe("resolveAttemptState", () => {
  it("distinguishes manual, automatic, and expired submissions", () => {
    expect(resolveAttemptState("in_progress", null)).toBe("active");
    expect(resolveAttemptState("submitted", "manual")).toBe("submitted");
    expect(resolveAttemptState("submitted", "auto_deadline")).toBe("auto_submitted");
    expect(resolveAttemptState("submitted", "auto_leave")).toBe("auto_submitted");
    expect(resolveAttemptState("submitted", "expired_sweep")).toBe("expired");
    expect(resolveAttemptState("graded", "auto_deadline")).toBe("graded");
    expect(attemptStateLabel("auto_submitted")).toBe("Auto-submitted");
  });
});
