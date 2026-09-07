import Link from "next/link";
import { getStudentAttempts, getStudentNotes, getStudentTests } from "@/lib/student";
import { requireRole } from "@/lib/auth";

export default async function StudentWorkspace() {
  const user = await requireRole(["student"]);
  const [notes, tests, attempts] = await Promise.all([
    getStudentNotes(),
    getStudentTests(),
    getStudentAttempts(),
  ]);

  const graded = attempts.filter((a) => a.score !== null && a.max_score !== null);
  const average = graded.length
    ? Math.round(graded.reduce((sum, a) => sum + Number(a.score) / Math.max(Number(a.max_score), 1) * 100, 0) / graded.length)
    : null;

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "end", flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow">Student workspace</span>
          <h1 style={{ fontSize: "clamp(42px,6vw,76px)", lineHeight: 0.95, letterSpacing: "-.06em", margin: "20px 0 12px" }}>Keep moving.</h1>
          <p style={{ color: "var(--muted)", maxWidth: 620, lineHeight: 1.65, margin: 0 }}>Your notes, assessments and learning progress live together here.</p>
        </div>
        <Link href="/app/notes/new" style={{ background: "var(--accent)", color: "white", padding: "13px 18px", borderRadius: 999, fontWeight: 700 }}>New note →</Link>
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginTop: 44 }}>
        {[
          ["Notes", String(notes.length), "/app/notes"],
          ["Available tests", String(tests.length), "/app/tests"],
          ["Attempts", String(attempts.length), "/app/results"],
          ["Average", average === null ? "—" : `${average}%`, "/app/progress"],
        ].map(([label, value, href]) => (
          <Link key={label} href={href} style={{ border: "1px solid var(--line)", borderRadius: 20, padding: 22, background: "white" }}>
            <span className="eyebrow">{label}</span>
            <strong style={{ display: "block", fontSize: 32, marginTop: 13, letterSpacing: "-.05em" }}>{value}</strong>
          </Link>
        ))}
      </section>

      <section style={{ marginTop: 54 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div><span className="eyebrow">Recent work</span><h2 style={{ fontSize: 28, letterSpacing: "-.04em", margin: "10px 0 0" }}>Pick up where you left off.</h2></div>
          <Link href="/app/notes" style={{ color: "var(--accent)", fontWeight: 700, fontSize: 14 }}>View notes →</Link>
        </div>
        <div style={{ display: "grid", gap: 0, marginTop: 20 }}>
          {notes.slice(0, 4).map((note) => (
            <Link href={`/app/notes/${note.id}`} key={note.id} style={{ borderTop: "1px solid var(--line)", padding: "18px 0", display: "flex", justifyContent: "space-between", gap: 18 }}>
              <div><strong>{note.title}</strong><p style={{ color: "var(--muted)", margin: "5px 0 0", fontSize: 14 }}>{note.content.slice(0, 110) || "Empty note"}</p></div>
              <span style={{ color: "var(--muted)", fontSize: 12, whiteSpace: "nowrap" }}>{note.visibility}</span>
            </Link>
          ))}
          {!notes.length && <div style={{ borderTop: "1px solid var(--line)", padding: "22px 0", color: "var(--muted)" }}>Your first note is waiting.</div>}
        </div>
      </section>

      <section style={{ marginTop: 54, borderRadius: 28, background: "var(--accent)", color: "white", padding: 30 }}>
        <span className="eyebrow" style={{ color: "#dff4c0" }}>Learning assistant</span>
        <h2 style={{ fontSize: 30, letterSpacing: "-.04em", margin: "12px 0 8px" }}>Ask better questions.</h2>
        <p style={{ color: "#d5dfdb", maxWidth: 620, lineHeight: 1.65, margin: 0 }}>The AI tutor will use your authorized learning context to explain concepts, challenge your reasoning and help you practice.</p>
        <span style={{ display: "inline-block", marginTop: 18, color: "#dff4c0", fontWeight: 700 }}>Coming in the next workspace milestone.</span>
      </section>
    </main>
  );
}
