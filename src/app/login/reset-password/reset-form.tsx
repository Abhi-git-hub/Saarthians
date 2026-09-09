"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateRecoveryPassword } from "../actions";

type Mode = "request" | "update" | "invalid";

export function PasswordResetForm({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Legacy implicit-flow links (#access_token=...&type=recovery) establish the
  // session on the client and emit PASSWORD_RECOVERY — upgrade to the update
  // form when that happens.
  useEffect(() => {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("update");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function requestReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    const supabase = createClient();
    // The callback exchanges the emailed code for a session server-side
    // (reliable cookie handling) and returns to this page with a session.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/login/reset-password`,
    });

    if (resetError) setError("We couldn't send the reset email. Check the address and try again.");
    else setMessage("Check your email for a secure password reset link.");

    setPending(false);
  }

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    const result = await updateRecoveryPassword({ password: newPassword, confirm: confirmPassword });
    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }

    router.replace("/login?reset=success");
    router.refresh();
  }

  if (mode === "update") {
    return (
      <form onSubmit={updatePassword} className="auth-form">
        <label className="field-label">
          New password
          <input required minLength={10} maxLength={128} type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 10 characters" />
        </label>
        <label className="field-label">
          Confirm new password
          <input required minLength={10} maxLength={128} type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </label>
        {error && <p role="alert" className="form-error">{error}</p>}
        {message && <p role="status" className="auth-hint">{message}</p>}
        <button disabled={pending} type="submit" className="primary-button">{pending ? "Updating…" : "Update password →"}</button>
      </form>
    );
  }

  if (mode === "invalid") {
    return (
      <div className="auth-form">
        <p role="alert" className="form-error">This reset link is invalid or has expired. Links work best when opened in the same browser they were requested from.</p>
        <button type="button" className="primary-button" onClick={() => { setMode("request"); setError(null); }}>Request a new link →</button>
      </div>
    );
  }

  return (
    <form onSubmit={requestReset} className="auth-form">
      <label className="field-label">
        Account email
        <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </label>
      {error && <p role="alert" className="form-error">{error}</p>}
      {message && <p role="status" className="auth-hint">{message}</p>}
      <button disabled={pending} type="submit" className="primary-button">{pending ? "Sending…" : "Send reset link →"}</button>
    </form>
  );
}
