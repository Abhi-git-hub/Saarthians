import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PasswordResetForm } from "./reset-form";

type Mode = "request" | "update" | "invalid";

// Recovery links from Supabase arrive as /login/reset-password?code=... (PKCE).
// The code must be exchanged server-side for a session; only then is the
// update-password form shown. Legacy implicit links (#access_token=...) are
// picked up by the client form, which upgrades itself on PASSWORD_RECOVERY.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const code = typeof params.code === "string" && params.code ? params.code : null;
  const errorParam = typeof params.error === "string" && params.error ? params.error : null;
  const recoveryFlag = params.recovery === "1";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    redirect(
      error
        ? "/login/reset-password?error=invalid_link"
        : "/login/reset-password?recovery=1",
    );
  }

  let mode: Mode = "request";
  if (errorParam) {
    mode = "invalid";
  } else if (recoveryFlag) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    mode = data.user ? "update" : "invalid";
  } else {
    // Primary path: /auth/callback exchanged the code and returned here with
    // a session. A signed-in visitor may also change their own password here.
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) mode = "update";
  }

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
