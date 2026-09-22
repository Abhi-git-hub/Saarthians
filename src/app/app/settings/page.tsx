import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PasswordForm, SignOutButton } from "@/components/settings/settings-forms";

const cardStyle = { border: "1px solid var(--line)", borderRadius: 20, padding: 24, background: "white" };

export default async function StudentSettingsPage() {
  const user = await requireRole(["student"]);

  return (
    <main className="container" style={{ padding: "48px 0 80px", maxWidth: 920 }}>
      <span className="eyebrow">Settings</span>
      <h1 style={{ fontSize: "clamp(40px,6vw,64px)", lineHeight: .95, letterSpacing: "-.06em", margin: "18px 0 10px" }}>Your account, in order.</h1>
      <p style={{ color: "var(--muted)", maxWidth: 640, lineHeight: 1.65, margin: "0 0 34px" }}>Everything you can change about your account lives here. Nothing else is editable — roles and assignments stay with your administrator.</p>
      <div style={{ display: "grid", gap: 14 }}>
        <section style={cardStyle}>
          <span className="eyebrow">Account</span>
          <div style={{ display: "grid", gap: 0, marginTop: 8 }}>
            {[["Name", user.displayName], ["Username", user.username ? `@${user.username}` : "—"], ["Role", "Student"], ["Access", "Active"]].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "14px 0", borderTop: "1px solid var(--line)" }}>
                <span style={{ color: "var(--muted)", fontSize: 14 }}>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
        <PasswordForm />
        <section style={cardStyle}>
          <span className="eyebrow">Session</span>
          <h2 style={{ fontSize: 24, letterSpacing: "-.03em", margin: "12px 0 6px" }}>Signed in on this device.</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 20px" }}>Signing out ends this session everywhere it is used on this device. Locked out? <Link href="/login/reset-password" style={{ textDecoration: "underline" }}>Reset your password by email</Link>.</p>
          <SignOutButton />
        </section>
      </div>
    </main>
  );
}
