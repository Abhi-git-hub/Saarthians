import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <span className="eyebrow">Account access</span>
        <h1>Accounts are provisioned.</h1>
        <p className="auth-lede">Saarthians does not use open self-registration. A signed-in administrator creates each student and teacher account with the correct role and profile details.</p>
        <Link href="/login" className="primary-button" style={{ display: "inline-flex", justifyContent: "center" }}>Go to sign in →</Link>
      </div>
    </main>
  );
}
