// Assessment lifecycle helpers (pure, unit-tested).
//
// Test lifecycle is DERIVED, not stored: the `tests.status` column stays
// draft/published/archived (teacher control), while scheduled/live/closed
// come from the start/end window against server time. The database RPCs
// enforce the same derivation, so the UI can never open a window the
// server would reject.

export type TestLifecycle = "draft" | "scheduled" | "live" | "closed" | "archived";

export function resolveTestLifecycle(
  status: string,
  startTime: string | null,
  endTime: string | null,
  now: number = Date.now(),
): TestLifecycle {
  if (status === "archived") return "archived";
  if (status !== "published") return "draft";
  if (startTime && now < new Date(startTime).getTime()) return "scheduled";
  if (endTime && now >= new Date(endTime).getTime()) return "closed";
  return "live";
}

export function lifecycleLabel(lifecycle: TestLifecycle): string {
  switch (lifecycle) {
    case "draft":
      return "Draft";
    case "scheduled":
      return "Scheduled";
    case "live":
      return "Live";
    case "closed":
      return "Closed";
    case "archived":
      return "Archived";
  }
}

// Attempt display states. The stored enum keeps created/in_progress/
// submitted/graded/reviewed; submission_reason distinguishes how a
// submission happened (manual vs automatic vs sweep).
export type AttemptDisplayState = "active" | "submitted" | "auto_submitted" | "expired" | "graded" | "reviewed";

export function resolveAttemptState(status: string, submissionReason: string | null): AttemptDisplayState {
  if (status === "in_progress" || status === "created") return "active";
  if (status === "graded") return "graded";
  if (status === "reviewed") return "reviewed";
  if (submissionReason === "expired_sweep") return "expired";
  if (submissionReason === "auto_deadline" || submissionReason === "auto_leave") return "auto_submitted";
  return "submitted";
}

export function attemptStateLabel(state: AttemptDisplayState): string {
  switch (state) {
    case "active":
      return "In progress";
    case "submitted":
      return "Submitted";
    case "auto_submitted":
      return "Auto-submitted";
    case "expired":
      return "Expired";
    case "graded":
      return "Graded";
    case "reviewed":
      return "Reviewed";
  }
}
