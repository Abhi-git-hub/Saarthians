import Link from "next/link";
import { deleteTeacherNote } from "./actions";
import { getTeacherNotes } from "@/lib/teacher-notes";

export default async function TeacherNotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const notes = await getTeacherNotes(search);

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "end", flexWrap: "wrap" }}>
        <div><span className="eyebrow">Learning material</span><h1 style={{ fontSize: "clamp(40px,6vw,68px)", lineHeight: .95, letterSpacing: "-.06em", margin: "16px 0 12px" }}>Teach it once.</h1><p style={{ color: "var(--muted)", maxWidth: 620, lineHeight: 1.7, margin: 0 }}>Write material once, share it with exactly the students who need it.</p></div>
        <Link href="/teacher/notes/new" style={{ background: "var(--accent)", color: "white", padding: "13px 18px", borderRadius: 999, fontWeight: 700 }}>New material →</Link>
      </div>
      <form method="get" style={{ marginTop: 30, display: "flex", gap: 10 }}>
        <input name="q" defaultValue={search} maxLength={120} placeholder="Search your material…" aria-label="Search material" style={inputStyle} />
        <button type="submit" style={buttonStyle}>Search</button>
        {search && <Link href="/teacher/notes" style={{ alignSelf: "center", color: "var(--muted)", fontSize: 14 }}>Clear</Link>}
      </form>
      <div style={{ marginTop: 26 }}>
        {notes.map((note) => (
          <article key={note.id} style={{ borderTop: "1px solid var(--line)", padding: "20px 0", display: "grid", gridTemplateColumns: "1fr auto", gap: 22, alignItems: "start" }}>
            <div><div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}><Link href={`/teacher/notes/${note.id}`} style={{ fontSize: 22, fontWeight: 750, letterSpacing: "-.03em" }}>{note.title}</Link><span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)" }}>{note.visibility}</span></div><p style={{ color: "var(--muted)", lineHeight: 1.6, margin: "7px 0 0", maxWidth: 760 }}>{note.content.slice(0, 180) || "Empty note"}</p></div>
            <form action={deleteTeacherNote}><input type="hidden" name="id" value={note.id} /><button type="submit" style={{ border: 0, background: "transparent", color: "var(--muted)", cursor: "pointer" }}>Delete</button></form>
          </article>
        ))}
        {!notes.length && <div style={{ borderTop: "1px solid var(--line)", padding: "28px 0", color: "var(--muted)" }}>{search ? "No material matches that search." : "No learning material yet. Write the explanation you keep repeating."}</div>}
      </div>
    </main>
  );
}

const inputStyle = { flex: 1, minWidth: 0, border: "1px solid var(--line)", borderRadius: 14, padding: "13px 14px", background: "white", color: "var(--ink)", font: "inherit", lineHeight: 1.6 };
const buttonStyle = { border: 0, borderRadius: 999, padding: "13px 20px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer", whiteSpace: "nowrap" as const };
