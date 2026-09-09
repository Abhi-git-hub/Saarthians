"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithIdentifier } from "./actions";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(searchParams.get("error") === "auth_callback" ? "That sign-in link is invalid or has expired. Please sign in again." : null);
  const resetDone = searchParams.get("reset") === "success";
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await signInWithIdentifier({ identifier, password, next: searchParams.get("next") });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.replace(result.redirectTo ?? "/app");
      router.refresh();
    } catch {
      setError("We couldn't complete sign in. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="auth-form">
      <label className="field-label">
        Username or email
        <input required minLength={3} maxLength={254} autoCapitalize="none" autoCorrect="off" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="your username or email" />
      </label>
      <label className="field-label">
        Password
        <input required minLength={8} maxLength={128} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <p className="auth-hint">Students and teachers use their provisioned username. Administrators use their existing account email.</p>
      {resetDone && <p role="status" className="form-success">Password updated. Sign in with your new password.</p>}
      {error && <p role="alert" className="form-error">{error}</p>}
      <button disabled={pending} type="submit" className="primary-button">{pending ? "Signing in…" : "Enter workspace →"}</button>
      <a href="/login/reset-password" className="auth-hint">Forgot your password?</a>
    </form>
  );
}
