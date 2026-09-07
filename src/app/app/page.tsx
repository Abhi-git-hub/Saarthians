import { requireRole } from "@/lib/auth";

export default async function StudentWorkspace() {
  const user = await requireRole(["student"]);

  return (
    <main className="container" style={{ padding: "70px 0" }}>
      <span className="eyebrow">Student workspace</span>
      <h1 style={{ fontSize: "clamp(44px,7vw,76px)", lineHeight: 0.95, letterSpacing: "-.06em", margin: "22px 0 14px" }}>
        Your learning, in one place.
      </h1>
      <p style={{ color: "var(--muted)", maxWidth: 620, lineHeight: 1.7 }}>
        Signed in as {user.email ?? "student"}. This protected surface is ready for notes, tests, results, progress and the learning assistant.
      </p>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginTop: 42 }}>
        {["Notes", "Tests", "Results", "Progress", "AI Tutor"].map((item) => (
          <article key={item} style={{ border: "1px solid var(--line)", borderRadius: 20, padding: 22 }}>
            <span className="eyebrow">Workspace</span>
            <h2 style={{ margin: "12px 0 0", fontSize: 22 }}>{item}</h2>
          </article>
        ))}
      </section>
    </main>
  );
}
