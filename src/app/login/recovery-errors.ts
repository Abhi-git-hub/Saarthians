// Pure mapping of Supabase password-update failures to safe user-facing
// messages. Deliberately NOT in actions.ts: "use server" modules may only
// export async functions, so this lives here to stay unit-testable and
// build-safe. No I/O, no secrets, never returns internal detail.

// Shape of failures returned by supabase.auth.updateUser(): an AuthError with
// a human message plus optional HTTP status / GoTrue code. Kept structural
// (not tied to the SDK class) so it stays unit-testable.
export type PasswordUpdateFailure = {
  message?: unknown;
  status?: unknown;
  code?: unknown;
} | null | undefined;

// Ordering is deliberate — reauthentication is checked before generic session
// text because a reauth demand can mention sessions too, and same-password is
// checked before strength because "should be different" contains "should".
export function mapUpdatePasswordError(error: PasswordUpdateFailure): string {
  const message = typeof error?.message === "string" ? error.message : "";
  const code = typeof error?.code === "string" ? error.code : "";
  const status = typeof error?.status === "number" ? error.status : null;
  const text = `${code} ${message}`;

  if (/reauthenticat|insufficient_aal|\baal2?\b|mfa|two[- ]factor|assurance/i.test(text)) {
    return "Your recovery session needs to be restarted. Request a new reset link.";
  }
  if (/same[- ]as|different from|must be different|password.*unchanged|unchanged.*password|matches.*(current|old|previous)/i.test(text)) {
    return "Choose a different password from the previous one.";
  }
  if (
    /weak_password|\bweak\b|too short|password should|at least \d+ char|must contain|character requirement|breach|pwned|compromised|entropy/i.test(
      text,
    ) ||
    status === 422
  ) {
    return "Choose a stronger password that meets the account password requirements.";
  }
  if (
    /session|expired|invalid.*token|invalid.*jwt|jwt|revoked|not authenticated|user not found|session_expired|invalid_jwt/i.test(
      text,
    ) ||
    status === 401 ||
    status === 403 ||
    status === 404
  ) {
    return "This reset link is invalid or has expired. Request a new link and try again.";
  }
  return "We couldn't update your password. Request a fresh link and try again.";
}
