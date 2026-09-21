import { cookies } from "next/headers";

// Server-verifiable password-recovery state.
//
// A normal Supabase session is NOT proof of recovery intent: any signed-in
// user has a session. So after /auth/callback successfully exchanges a
// recovery code, it sets this short-lived, HTTP-only marker bound to the
// recovered user's id. updateRecoveryPassword() requires the marker AND a
// matching live session. The value itself is just a user id (already visible
// in admin URLs) — no secrets, tokens, or passwords ever go in the cookie.
export const RECOVERY_COOKIE_NAME = "saarthians_recovery";
export const RECOVERY_COOKIE_MAX_AGE = 900; // 15 minutes
export const RECOVERY_COOKIE_PATH = "/login/reset-password";

export type ResetMode = "request" | "update" | "invalid";

function cookieAttributes() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: RECOVERY_COOKIE_PATH,
  };
}

// Pure mode decision, unit-testable. A signed-in session alone NEVER yields
// "update" — only a marker bound to that same session does.
export function decideResetMode(
  markerUserId: string | null,
  sessionUserId: string | null,
  hasError: boolean,
): ResetMode {
  if (hasError) return "invalid";
  if (markerUserId && sessionUserId && markerUserId === sessionUserId) return "update";
  if (markerUserId) return "invalid";
  return "request";
}

// Reads the marker. Only UUID-shaped values are accepted; anything else is
// treated as absent. Never trust the content beyond that.
export async function getRecoveryUserId(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(RECOVERY_COOKIE_NAME)?.value;
  return value && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

// Invalidates the marker. Safe to call when it is already absent.
export async function clearRecoveryMarker(): Promise<void> {
  const store = await cookies();
  store.set(RECOVERY_COOKIE_NAME, "", { ...cookieAttributes(), maxAge: 0 });
}

// Attributes shared with the /auth/callback route handler, which sets the
// cookie on its redirect response (Route Handlers can write response cookies;
// Server Components cannot do this reliably).
export function recoveryCookieAttributes() {
  return { ...cookieAttributes(), maxAge: RECOVERY_COOKIE_MAX_AGE };
}
