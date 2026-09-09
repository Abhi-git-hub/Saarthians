import Link from "next/link";
import { notFound } from "next/navigation";
import { updateNote } from "../../actions";
import { createClient } from "@/lib/supabase/server";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: note, error } = await supabase
    .from("notes")
    .select("id,title,content,visibility,status")
    .eq("id", id)
    .single();

  if (error || !note) notFound();

  return (
    <main className="container" style={{ padding: "48px 0 80px", maxWidth: 920 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/app/notes" style={{ color: "var(--muted)", fontSize: 13 }}>← Back to notes</Link>
        <span style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".1em" }}>{note.visibility}</span>
      </div>
      <span className="eyebrow" style={{ display: "flex", marginTop: 30 }}>Edit note</span>
      <h1 style={{ fontSize: "clamp(42px,6vw,70px)", lineHeight: .95, letterSpacing: "-.06em", margin: "16px 0 30px" }}>{note.title}</h1>
      <form action={updateNote} style={{ display: "grid", gap: 18 }}>
        <input type="hidden" name="id" value={note.id} />
        <label style={labelStyle}>Title<input name="title" required maxLength={200} defaultValue={note.title} style={inputStyle} /></label>
        <label style={labelStyle}>Content<textarea name="content" rows={18} maxLength={50000} defaultValue={note.content} style={{ ...inputStyle, resize: "vertical" }} /></label>
        <label style={labelStyle}>Visibility<select name="visibility" defaultValue={note.visibility} style={inputStyle}><option value="private">Private</option><option value="shared">Shared</option><option value="published">Published</option></select></label>
        <button type="submit" style={buttonStyle}>Save changes →</button>
      </form>
    </main>
  );
}

const labelStyle = { display: "grid", gap: 8, fontSize: 14, fontWeight: 700 };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, border: "1px solid var(--line)", borderRadius: 14, padding: "13px 14px", background: "white", color: "var(--ink)", font: "inherit", lineHeight: 1.6 };
const buttonStyle = { border: 0, borderRadius: 999, padding: "14px 20px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer" };
