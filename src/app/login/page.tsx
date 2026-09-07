import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="container" style={{ padding: "90px 0" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <span className="eyebrow">Saarthians workspace</span>
        <h1 style={{ fontSize: "clamp(44px,7vw,72px)", lineHeight: 0.95, letterSpacing: "-.06em", margin: "22px 0 16px" }}>
          Welcome back.
        </h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: 32 }}>
          Sign in to continue to your learning workspace.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
