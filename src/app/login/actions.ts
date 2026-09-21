"use server";

import { createClient } from "@/lib/supabase/server";
import { clearRecoveryMarker, getRecoveryUserId } from "@/lib/recovery";
import { loginIdentifierSchema } from "@/lib/security";

const managedAccountDomain = "accounts.saarthians.online";

export async function signInWithIdentifier(input: { identifier: string; password: string; next?: string | null }) {
  const parsedIdentifier = loginIdentifierSchema.safeParse(input.identifier);
  if (!parsedIdentifier.success || typeof input.password !== "string" || input.password.length < 8 || input.password.length > 128) {
    return { error: "Enter your username (or administrator email) and password." };
  }

  const identifier = parsedIdentifier.data.toLowerCase();
  const email = identifier.includes("@") ? identifier : `${identifier}@${managedAccountDomain}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: input.password });

  // Only reached after a correct password, so distinguishing the cause here
  // does not aid account enumeration — but it tells the user what to fix.
  if (error) {
    if (/email not confirmed/i.test(error.message)) {
      return { error: "This account's email is not confirmed yet. Ask the administrator to confirm it, then try again." };
    }
    if (/invalid login credentials/i.test(error.message)) {
      return { error: "We couldn't sign you in. Check your username and password and try again." };
    }
    return { error: "We couldn't sign you in. Check your credentials and try again." };
  }

  const { data: authUser } = await supabase.auth.getUser();
  const { data: profile } = authUser.user
    ? await supabase.from("profiles").select("status,role").eq("id", authUser.user.id).maybeSingle()
    : { data: null };

  if (!profile || profile.status !== "active" || !["student", "teacher", "admin"].includes(profile.role)) {
    await supabase.auth.signOut();
    return { error: "This account is not active. Contact the administrator." };
  }

  const next = input.next;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  const redirectTo = safeNext ?? (profile.role === "admin" ? "/admin" : profile.role === "teacher" ? "/teacher" : "/app");
  return { ok: true, redirectTo };
}

// Completes a password-recovery flow. Requires BOTH the server-verified
// recovery marker (set by /auth/callback after a successful code exchange,
// bound to the recovered user) AND a live session for that same user. A
// normal logged-in session alone is never sufficient, and neither is the
// marker without its session.
type RecoveryResult = { ok: true } | { error: string };

const INVALID_RECOVERY_ERROR =
  "This reset link is invalid or has expired. Request a new link and try again.";

export async function updateRecoveryPassword(input: { password: string; confirm: string }): Promise<RecoveryResult> {
  const { password, confirm } = input;

  if (typeof password !== "string" || password.length < 10 || password.length > 128) {
    return { error: "Use a password between 10 and 128 characters." };
  }
  if (password !== confirm) {
    return { error: "The two passwords do not match." };
  }

  const supabase = await createClient();
  const [markerUserId, { data: authUser }] = await Promise.all([
    getRecoveryUserId(),
    supabase.auth.getUser(),
  ]);
  const sessionUserId = authUser.user?.id ?? null;

  if (!markerUserId || !sessionUserId || markerUserId !== sessionUserId) {
    // Stale or mismatched marker (e.g. a different account signed in after
    // the recovery link was opened): drop it so it cannot linger.
    if (markerUserId) {
      try {
        await clearRecoveryMarker();
      } catch {
        // Non-fatal: the marker self-expires within minutes.
      }
    }
    return { error: INVALID_RECOVERY_ERROR };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "We couldn't update your password. Request a fresh link and try again." };
  }

  // Invalidate the marker and end the single-purpose recovery session so the
  // new password is verified through a normal login immediately afterwards.
  // The marker is cleared first: even if sign-out below failed, the marker
  // alone can never authorize another update.
  try {
    await clearRecoveryMarker();
  } catch {
    // Non-fatal for the same reason as above.
  }
  await supabase.auth.signOut();
  return { ok: true };
}
