"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/security";

export function SignupForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError("Enter a valid email and a password between 8 and 128 characters.");
      setPending(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: signupError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: { display_name: displayName.trim().slice(0, 120) },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signupError) {
        setError("We couldn't create the account. Please check your details and try again.");
        return;
      }

      if (data.session) {
        router.replace("/app");
        router.refresh();
        return;
      }

      setMessage("Account created. Check your email to confirm your address, then sign in.");
    } catch {
      setError("We couldn't complete account creation. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
      <label style={labelStyle}>
        Name
        <input required maxLength={120} autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        Email
        <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        Password
        <input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
      </label>
      {error && <p role="alert" style={{ color: "#a33", margin: 0 }}>{error}</p>}
      {message && <p role="status" style={{ color: "var(--accent)", margin: 0 }}>{message}</p>}
      <button disabled={pending} type="submit" style={buttonStyle}>
        {pending ? "Creating…" : "Create student account →"}
      </button>
      <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
        Already have an account? <a href="/login" style={{ textDecoration: "underline" }}>Sign in</a>.
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
