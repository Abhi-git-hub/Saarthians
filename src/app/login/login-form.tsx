"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
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
      <label style={{ display: "grid", gap: 8, fontSize: 14, fontWeight: 650 }}>
        Email
        <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
      </label>
      <label style={{ display: "grid", gap: 8, fontSize: 14, fontWeight: 650 }}>
        Password
        <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
      </label>
      {error && <p role="alert" style={{ color: "#a33", margin: 0 }}>{error}</p>}
      <button disabled={pending} type="submit" style={buttonStyle}>
        {pending ? "Signing in…" : "Sign in →"}
      </button>
    </form>
  );
}

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
