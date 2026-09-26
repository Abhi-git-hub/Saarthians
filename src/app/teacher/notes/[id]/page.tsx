import Link from "next/link";
import { notFound } from "next/navigation";
import { updateTeacherNote } from "../actions";
import { requireRole } from "@/lib/auth";
import { getNoteDetail } from "@/lib/notes";
import { NoteImagesManager } from "@/components/note-images-manager";

export default async function TeacherNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole(["teacher", "admin"]);
  const note = await getNoteDetail(id);

  if (!note) notFound();

  return (
    <main className="container" style={{ padding: "48px 0 80px", maxWidth: 920 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/teacher/notes" style={{ color: "var(--muted)", fontSize: 13 }}>← Back to material</Link>
        <span style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".1em" }}>
          by {note.isOwner ? "you" : note.owner_name}
        </span>
      </div>
      <span className="eyebrow" style={{ display: "flex", marginTop: 30 }}>{note.isOwner ? "Edit material" : "Shared material"}</span>
      <h1 style={{ fontSize: "clamp(42px,6vw,70px)", lineHeight: .95, letterSpacing: "-.06em", margin: "16px 0 30px" }}>{note.title}</h1>
      {note.isOwner ? (
        <form action={updateTeacherNote} style={{ display: "grid", gap: 18 }}>
          <input type="hidden" name="id" value={note.id} />
          <label style={labelStyle}>Title<input name="title" required maxLength={200} defaultValue={note.title} style={inputStyle} /></label>
          <label style={labelStyle}>Content<textarea name="content" rows={15} maxLength={50000} defaultValue={note.content} style={{ ...inputStyle, resize: "vertical" }} /></label>
          <button type="submit" style={buttonStyle}>Save changes →</button>
        </form>
      ) : (
        <article style={{ ...inputStyle, whiteSpace: "pre-wrap", minHeight: 240 }}>{note.content || "Empty note"}</article>
      )}
      <NoteImagesManager noteId={note.id} images={note.images} canEdit={note.isOwner} />
    </main>
  );
}

const labelStyle = { display: "grid", gap: 8, fontSize: 14, fontWeight: 700 };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, border: "1px solid var(--line)", borderRadius: 14, padding: "13px 14px", background: "white", color: "var(--ink)", font: "inherit", lineHeight: 1.6 };
const buttonStyle = { border: 0, borderRadius: 999, padding: "14px 20px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer" };
