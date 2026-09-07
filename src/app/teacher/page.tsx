import { requireRole } from "@/lib/auth";

export default async function TeacherWorkspace() {
  const user = await requireRole(["teacher", "admin"]);

  return (
    <main className="container" style={{ padding: "70px 0" }}>
      <span className="eyebrow">Teacher workspace</span>
      <h1 style={{ fontSize: "clamp(44px,7vw,76px)", lineHeight: 0.95, letterSpacing: "-.06em", margin: "22px 0 14px" }}>
        Teach with visibility.
      </h1>
      <p style={{ color: "var(--muted)", maxWidth: 620, lineHeight: 1.7 }}>
        Signed in as {user.email ?? "teacher"}. Student relationships, notes, assessments and results will live behind this server-authorized surface.
      </p>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14, marginTop: 42 }}>
        {["Students", "Materials", "Tests", "Results"].map((item) => (
          <article key={item} style={{ border: "1px solid var(--line)", borderRadius: 20, padding: 22 }}>
            <span className="eyebrow">Teacher tools</span>
            <h2 style={{ margin: "12px 0 0", fontSize: 22 }}>{item}</h2>
          </article>
        ))}
      </section>
    </main>
  );
}
