import { createClient } from "@/lib/supabase/server";
import { decideResetMode, getRecoveryUserId } from "@/lib/recovery";
import { PasswordResetForm } from "./reset-form";

// /auth/callback is the single canonical place that exchanges emailed PKCE
// codes. A successful recovery exchange sets a short-lived, HTTP-only marker
// bound to the recovered user — and ONLY that marker (never a bare session)
// unlocks the update-password form. A normally signed-in visitor always sees
// the email-entry form here.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const hasError = typeof params.error === "string" && params.error ? true : false;

  const supabase = await createClient();
  const [{ data }, markerUserId] = await Promise.all([
    supabase.auth.getUser(),
    getRecoveryUserId(),
  ]);
  const mode = decideResetMode(markerUserId, data.user?.id ?? null, hasError);

  return (
    <main className="auth-page">
      <div className="auth-card">
        <span className="eyebrow">Saarthians workspace</span>
        <h1>{mode === "update" ? "Choose a new password." : "Reset your password."}</h1>
        <p className="auth-lede">
          {mode === "update"
            ? "Your recovery link is verified. Enter a new password below — it takes effect immediately."
            : "Use the email attached to your Saarthians account. The reset link is single-purpose and expires according to your Supabase Auth settings."}
        </p>
        <PasswordResetForm initialMode={mode} />
        <div className="auth-footer"><a href="/login">← Back to sign in</a></div>
      </div>
    </main>
  );
}
