"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/security";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "auth_callback"
      ? "That sign-in link is invalid or has expired. Please sign in again."
      : null,
  );
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError("Enter a valid email and password.");
      setPending(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
      if (signInError) {
        setError("We couldn't sign you in. Check your credentials and try again.");
        return;
      }

      const next = searchParams.get("next");
      const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/app";
      router.replace(safeNext);
      router.refresh();
    } catch {
      setError("We couldn't complete sign in. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
      <label style={labelStyle}>
        Email
        <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        Password
        <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
      </label>
      {error && <p role="alert" style={{ color: "#a33", margin: 0 }}>{error}</p>}
      <button disabled={pending} type="submit" style={buttonStyle}>
        {pending ? "Signing in…" : "Sign in →"}
      </button>
      <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
        New to Saarthians? <a href="/signup" style={{ textDecoration: "underline" }}>Create a student account</a>.
      </p>
    </form>
  );
}

const labelStyle = { display: "grid", gap: 8, fontSize: 14, fontWeight: 650 };
const inputStyle = {
  width: "100%",
  border: "1px solid var(--line)",
  borderRadius: 14,
  padding: "13px 14px",
  background: "var(--paper)",
  color: "var(--ink)",
  font: "inherit",
  boxSizing: "border-box" as const,
};
const buttonStyle = {
  border: 0,
  borderRadius: 999,
  padding: "14px 20px",
  background: "var(--accent)",
  color: "white",
  fontWeight: 750,
  cursor: "pointer",
};
