import { requireRole } from "@/lib/auth";

export default async function AdminWorkspace() {
  const user = await requireRole(["admin"]);

  return (
    <main className="container" style={{ padding: "70px 0" }}>
      <span className="eyebrow">Administration</span>
      <h1 style={{ fontSize: "clamp(44px,7vw,76px)", lineHeight: 0.95, letterSpacing: "-.06em", margin: "22px 0 14px" }}>
        System control, carefully scoped.
      </h1>
      <p style={{ color: "var(--muted)", maxWidth: 620, lineHeight: 1.7 }}>
        Signed in as {user.email ?? "administrator"}. High-risk administration will be audited and remain server-authorized.
      </p>
    </main>
  );
}
