import Link from "next/link";
import { createTeacherNote } from "../actions";

const labelStyle = { display: "grid", gap: 8, fontSize: 14, fontWeight: 700 };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, border: "1px solid var(--line)", borderRadius: 14, padding: "13px 14px", background: "white", color: "var(--ink)", font: "inherit", lineHeight: 1.6 };
const buttonStyle = { border: 0, borderRadius: 999, padding: "14px 20px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer" };

export default function NewTeacherNotePage() {
  return (
    <main className="container" style={{ padding: "48px 0 80px", maxWidth: 920 }}>
      <Link href="/teacher/notes" style={{ color: "var(--muted)", fontSize: 13 }}>← Back to material</Link>
      <span className="eyebrow" style={{ display: "flex", marginTop: 30 }}>New material</span>
      <h1 style={{ fontSize: "clamp(42px,6vw,70px)", lineHeight: .95, letterSpacing: "-.06em", margin: "16px 0 30px" }}>Write it once.</h1>
      <form action={createTeacherNote} style={{ display: "grid", gap: 18 }}>
        <label style={labelStyle}>Title<input name="title" required maxLength={200} placeholder="e.g. Fractions — the pizza method" style={inputStyle} /></label>
        <label style={labelStyle}>Content<textarea name="content" rows={15} maxLength={50000} placeholder="Explain it the way you would in class…" style={{ ...inputStyle, resize: "vertical" }} /></label>
        <label style={labelStyle}>Visibility<select name="visibility" defaultValue="private" style={inputStyle}><option value="private">Private</option><option value="shared">Shared</option><option value="published">Published</option></select></label>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 6 }}><button type="submit" style={buttonStyle}>Save material →</button><Link href="/teacher/notes" style={{ color: "var(--muted)", fontSize: 14 }}>Cancel</Link></div>
      </form>
    </main>
  );
}
