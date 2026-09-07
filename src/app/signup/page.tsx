import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="container" style={{ padding: "90px 0" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <span className="eyebrow">Start learning</span>
        <h1 style={{ fontSize: "clamp(44px,7vw,72px)", lineHeight: 0.95, letterSpacing: "-.06em", margin: "22px 0 16px" }}>
          Create your workspace.
        </h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: 32 }}>
          Student accounts start with the learning workspace. Teacher and admin access is provisioned separately.
        </p>
        <SignupForm />
      </div>
    </main>
  );
}
