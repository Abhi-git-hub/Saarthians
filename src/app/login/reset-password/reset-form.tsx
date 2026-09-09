"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function PasswordResetForm() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isRecovery, setIsRecovery] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function requestReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/login/reset-password`,
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

    if (newPassword.length < 8) {
      setError("Use a password with at least 8 characters.");
      setPending(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) setError("We couldn't update your password. Request a fresh reset link and try again.");
    else setMessage("Password updated. Return to the sign-in page and use your new password.");

    setPending(false);
  }

  if (isRecovery) {
    return (
      <form onSubmit={updatePassword} className="auth-form">
        <label className="field-label">
          New password
          <input required minLength={8} maxLength={128} type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </label>
        {error && <p role="alert" className="form-error">{error}</p>}
        {message && <p role="status" className="auth-hint">{message}</p>}
        <button disabled={pending} type="submit" className="primary-button">{pending ? "Updating…" : "Update password →"}</button>
      </form>
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
