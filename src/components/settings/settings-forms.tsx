"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeOwnPassword } from "@/lib/account";

const cardStyle = { border: "1px solid var(--line)", borderRadius: 20, padding: 24, background: "white" };
const labelStyle = { display: "grid", gap: 8, fontSize: 14, fontWeight: 700 };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, border: "1px solid var(--line)", borderRadius: 14, padding: "13px 14px", background: "white", color: "var(--ink)", font: "inherit", lineHeight: 1.6 };
const buttonStyle = { border: 0, borderRadius: 999, padding: "14px 20px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer" };

export function PasswordForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function submit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await changeOwnPassword({
        newPassword: String(formData.get("newPassword") ?? ""),
        confirmPassword: String(formData.get("confirmPassword") ?? ""),
      });
      if ("error" in result) {
        setIsError(true);
        setMessage(result.error);
      } else {
        setIsError(false);
        setMessage("Password updated. Use it the next time you sign in.");
        setFormKey((key) => key + 1);
      }
    });
  }

  return (
    <section style={cardStyle}>
      <span className="eyebrow">Password</span>
      <h2 style={{ fontSize: 24, letterSpacing: "-.03em", margin: "12px 0 6px" }}>Change your password.</h2>
      <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 20px" }}>Only your own password can be changed here. Admins manage everyone else&apos;s accounts.</p>
      <form key={formKey} action={submit} style={{ display: "grid", gap: 16 }}>
        <label style={labelStyle}>New password<input name="newPassword" type="password" required minLength={10} maxLength={128} autoComplete="new-password" style={inputStyle} /></label>
        <label style={labelStyle}>Confirm new password<input name="confirmPassword" type="password" required minLength={10} maxLength={128} autoComplete="new-password" style={inputStyle} /></label>
        {message && <p role={isError ? "alert" : "status"} style={{ color: isError ? "#a33" : "var(--accent)", margin: 0, fontWeight: isError ? 400 : 650 }}>{message}</p>}
        <div><button type="submit" disabled={pending} style={buttonStyle}>{pending ? "Updating…" : "Update password →"}</button></div>
      </form>
    </section>
  );
}

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      try {
        await fetch("/api/auth/signout", { method: "POST" });
      } catch {
        // Non-fatal: fall through to the login screen regardless.
      }
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <button type="button" onClick={signOut} disabled={pending} style={{ ...buttonStyle, background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }}>
      {pending ? "Signing out…" : "Sign out →"}
    </button>
  );
}
