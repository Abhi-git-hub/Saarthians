import Link from "next/link";
import { deleteNote } from "../actions";
import { getSharedNotes, getStudentNotes } from "@/lib/student";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const [notes, shared] = await Promise.all([getStudentNotes(search), getSharedNotes(search)]);

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "end", flexWrap: "wrap" }}>
        <div><span className="eyebrow">Notes</span><h1 style={{ fontSize: "clamp(42px,6vw,70px)", lineHeight: .95, letterSpacing: "-.06em", margin: "18px 0 10px" }}>Think on paper.</h1><p style={{ color: "var(--muted)", margin: 0 }}>Private by default. Yours to revisit, revise and learn from.</p></div>
        <Link href="/app/notes/new" style={{ background: "var(--accent)", color: "white", padding: "13px 18px", borderRadius: 999, fontWeight: 700 }}>New note →</Link>
      </div>
      <form method="get" style={{ marginTop: 30, display: "flex", gap: 10 }}>
        <input name="q" defaultValue={search} maxLength={120} placeholder="Search your notes…" aria-label="Search notes" style={inputStyle} />
        <button type="submit" style={buttonStyle}>Search</button>
        {search && <Link href="/app/notes" style={{ alignSelf: "center", color: "var(--muted)", fontSize: 14 }}>Clear</Link>}
      </form>
      <div style={{ marginTop: 26 }}>
        {notes.map((note) => (
          <article key={note.id} style={{ borderTop: "1px solid var(--line)", padding: "20px 0", display: "grid", gridTemplateColumns: "1fr auto", gap: 22, alignItems: "start" }}>
            <div><div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}><Link href={`/app/notes/${note.id}`} style={{ fontSize: 22, fontWeight: 750, letterSpacing: "-.03em" }}>{note.title}</Link><span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)" }}>{note.visibility}</span></div><p style={{ color: "var(--muted)", lineHeight: 1.6, margin: "7px 0 0", maxWidth: 760 }}>{note.content.slice(0, 180) || "Empty note"}</p></div>
            <form action={deleteNote}><input type="hidden" name="id" value={note.id} /><button type="submit" style={{ border: 0, background: "transparent", color: "var(--muted)", cursor: "pointer" }}>Delete</button></form>
          </article>
        ))}
        {!notes.length && <div style={{ borderTop: "1px solid var(--line)", padding: "28px 0", color: "var(--muted)" }}>{search ? "No notes match that search." : "No notes yet. Start with the idea you keep coming back to."}</div>}
      </div>
      <section style={{ marginTop: 44 }}>
        <span className="eyebrow">Shared with you</span>
        <h2 style={{ fontSize: 26, letterSpacing: "-.03em", margin: "12px 0 4px" }}>From your teachers.</h2>
        <div style={{ marginTop: 10 }}>
          {shared.map((note) => (
            <Link href={`/app/notes/${note.id}`} key={note.id} style={{ display: "block", borderTop: "1px solid var(--line)", padding: "18px 0" }}>
              <strong style={{ fontSize: 19 }}>{note.title}</strong>
              <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: "6px 0 0", maxWidth: 760 }}>{note.content.slice(0, 160) || "Empty note"}</p>
            </Link>
          ))}
          {!shared.length && <div style={{ borderTop: "1px solid var(--line)", padding: "24px 0", color: "var(--muted)" }}>No shared material yet. Anything a teacher shares with you will appear here.</div>}
        </div>
      </section>
    </main>
  );
}

const inputStyle = { flex: 1, minWidth: 0, border: "1px solid var(--line)", borderRadius: 14, padding: "13px 14px", background: "white", color: "var(--ink)", font: "inherit", lineHeight: 1.6 };
const buttonStyle = { border: 0, borderRadius: 999, padding: "13px 20px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer", whiteSpace: "nowrap" as const };
