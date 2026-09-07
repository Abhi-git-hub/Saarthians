import Link from "next/link";
import { createTest } from "./actions";
import { requireRole } from "@/lib/auth";

export default async function NewTestPage() {
  await requireRole(["teacher", "admin"]);

  return (
    <main className="container" style={{ padding: "48px 0 80px", maxWidth: 820 }}>
      <Link href="/teacher/tests" style={{ color: "var(--muted)", fontSize: 13 }}>← Assessments</Link>
      <span className="eyebrow" style={{ display: "flex", marginTop: 28 }}>New assessment</span>
      <h1 style={{ fontSize: "clamp(40px,6vw,68px)", lineHeight: .95, letterSpacing: "-.06em", margin: "16px 0 12px" }}>Create a test.</h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>The test is created as a draft. Questions and publishing are handled through server-authorized workflows.</p>
      <form action={createTest} style={{ marginTop: 34, display: "grid", gap: 18, padding: 26, border: "1px solid var(--line)", borderRadius: 22, background: "white" }}>
        <label style={{ display: "grid", gap: 8, fontWeight: 700 }}>
          Title
          <input name="title" required maxLength={200} placeholder="e.g. Algebra — Linear Equations" style={inputStyle} />
        </label>
        <label style={{ display: "grid", gap: 8, fontWeight: 700 }}>
          Instructions
          <textarea name="instructions" rows={5} placeholder="Tell students what to focus on…" style={{ ...inputStyle, resize: "vertical" }} />
        </label>
        <label style={{ display: "grid", gap: 8, fontWeight: 700 }}>
          Duration (minutes)
          <input name="duration" type="number" min={1} max={600} placeholder="45" style={inputStyle} />
        </label>
        <button type="submit" style={buttonStyle}>Create draft →</button>
      </form>
    </main>
  );
}

const inputStyle = { width: "100%", border: "1px solid var(--line)", borderRadius: 14, padding: "13px 14px", background: "var(--paper)", color: "var(--ink)", font: "inherit", boxSizing: "border-box" as const };
const buttonStyle = { border: 0, borderRadius: 999, padding: "14px 20px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer" };
