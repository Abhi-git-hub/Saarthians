import { PasswordResetForm } from "./reset-form";

export default function ResetPasswordPage() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <span className="eyebrow">Saarthians workspace</span>
        <h1>Reset your password.</h1>
        <p className="auth-lede">Use the email attached to your Saarthians account. The reset link is single-purpose and expires according to your Supabase Auth settings.</p>
        <PasswordResetForm />
        <div className="auth-footer"><a href="/login">← Back to sign in</a></div>
      </div>
    </main>
  );
}
