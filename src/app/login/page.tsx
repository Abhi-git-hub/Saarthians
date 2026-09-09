import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <span className="eyebrow">Saarthians workspace</span>
        <h1>Welcome back.</h1>
        <p className="auth-lede">Your account is provisioned by the Saarthians administrator. Students and teachers enter with the username and password they were given.</p>
        <LoginForm />
        <div className="auth-footer">Need access? Contact your Saarthians administrator.</div>
      </div>
    </main>
  );
}
