import Link from "next/link";
import { deleteNote } from "../actions";
import { getStudentNotes } from "@/lib/student";

export default async function NotesPage() {
  const notes = await getStudentNotes();

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "end", flexWrap: "wrap" }}>
        <div><span className="eyebrow">Notes</span><h1 style={{ fontSize: "clamp(42px,6vw,70px)", lineHeight: .95, letterSpacing: "-.06em", margin: "18px 0 10px" }}>Think on paper.</h1><p style={{ color: "var(--muted)", margin: 0 }}>Private by default. Yours to revisit, revise and learn from.</p></div>
        <Link href="/app/notes/new" style={{ background: "var(--accent)", color: "white", padding: "13px 18px", borderRadius: 999, fontWeight: 700 }}>New note →</Link>
      </div>
      <div style={{ marginTop: 42 }}>
        {notes.map((note) => (
          <article key={note.id} style={{ borderTop: "1px solid var(--line)", padding: "20px 0", display: "grid", gridTemplateColumns: "1fr auto", gap: 22, alignItems: "start" }}>
            <div><div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}><Link href={`/app/notes/${note.id}`} style={{ fontSize: 22, fontWeight: 750, letterSpacing: "-.03em" }}>{note.title}</Link><span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)" }}>{note.visibility}</span></div><p style={{ color: "var(--muted)", lineHeight: 1.6, margin: "7px 0 0", maxWidth: 760 }}>{note.content.slice(0, 180) || "Empty note"}</p></div>
            <form action={deleteNote}><input type="hidden" name="id" value={note.id} /><button type="submit" style={{ border: 0, background: "transparent", color: "var(--muted)", cursor: "pointer" }}>Delete</button></form>
          </article>
        ))}
        {!notes.length && <div style={{ borderTop: "1px solid var(--line)", padding: "28px 0", color: "var(--muted)" }}>No notes yet. Start with the idea you keep coming back to.</div>}
      </div>
    </main>
  );
}
