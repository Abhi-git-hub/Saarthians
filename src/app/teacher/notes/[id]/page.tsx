import Link from "next/link";
import { notFound } from "next/navigation";
import { shareTeacherNote, unshareTeacherNote, updateTeacherNote } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { getShareableStudents, getTeacherNoteShares } from "@/lib/teacher-notes";

export default async function TeacherNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["teacher", "admin"]);
  const supabase = await createClient();
  const { data: note, error } = await supabase
    .from("notes")
    .select("id,title,content,visibility,status")
    .eq("id", id)
    .eq("owner_user_id", user.id)
    .single();

  if (error || !note) notFound();

  const [shares, students] = await Promise.all([getTeacherNoteShares(id), getShareableStudents()]);
  const sharedIds = new Set(shares.map((share) => share.student_id));
  const unshared = students.filter((student) => !sharedIds.has(student.id));

  return (
    <main className="container" style={{ padding: "48px 0 80px", maxWidth: 920 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/teacher/notes" style={{ color: "var(--muted)", fontSize: 13 }}>← Back to material</Link>
        <span style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".1em" }}>{note.visibility}</span>
      </div>
      <span className="eyebrow" style={{ display: "flex", marginTop: 30 }}>Edit material</span>
      <h1 style={{ fontSize: "clamp(42px,6vw,70px)", lineHeight: .95, letterSpacing: "-.06em", margin: "16px 0 30px" }}>{note.title}</h1>
      <form action={updateTeacherNote} style={{ display: "grid", gap: 18 }}>
        <input type="hidden" name="id" value={note.id} />
        <label style={labelStyle}>Title<input name="title" required maxLength={200} defaultValue={note.title} style={inputStyle} /></label>
        <label style={labelStyle}>Content<textarea name="content" rows={15} maxLength={50000} defaultValue={note.content} style={{ ...inputStyle, resize: "vertical" }} /></label>
        <label style={labelStyle}>Visibility<select name="visibility" defaultValue={note.visibility} style={inputStyle}><option value="private">Private</option><option value="shared">Shared</option><option value="published">Published</option></select></label>
        <button type="submit" style={buttonStyle}>Save changes →</button>
      </form>
      <section style={{ marginTop: 48 }}>
        <span className="eyebrow">Shared with</span>
        <h2 style={{ fontSize: 26, letterSpacing: "-.03em", margin: "12px 0 4px" }}>Exactly who needs it.</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 18px" }}>Only students assigned to you can receive shared material.</p>
        <div style={{ display: "grid", gap: 0 }}>
          {shares.map((share) => (
            <div key={share.student_id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", borderTop: "1px solid var(--line)", padding: "14px 0" }}>
              <strong>{share.display_name}</strong>
              <form action={unshareTeacherNote}><input type="hidden" name="noteId" value={note.id} /><input type="hidden" name="studentId" value={share.student_id} /><button type="submit" style={{ border: 0, background: "transparent", color: "var(--muted)", cursor: "pointer" }}>Remove</button></form>
            </div>
          ))}
          {!shares.length && <div style={{ borderTop: "1px solid var(--line)", padding: "20px 0", color: "var(--muted)" }}>Not shared with anyone yet.</div>}
        </div>
        {unshared.length > 0 && (
          <form action={shareTeacherNote} style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <input type="hidden" name="noteId" value={note.id} />
            <select name="studentId" required defaultValue="" aria-label="Student to share with" style={{ ...inputStyle, flex: 1, minWidth: 200 }}>
              <option value="" disabled>Select a student…</option>
              {unshared.map((student) => <option key={student.id} value={student.id}>{student.display_name}</option>)}
            </select>
            <button type="submit" style={buttonStyle}>Share →</button>
          </form>
        )}
      </section>
    </main>
  );
}

const labelStyle = { display: "grid", gap: 8, fontSize: 14, fontWeight: 700 };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, border: "1px solid var(--line)", borderRadius: 14, padding: "13px 14px", background: "white", color: "var(--ink)", font: "inherit", lineHeight: 1.6 };
const buttonStyle = { border: 0, borderRadius: 999, padding: "14px 20px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer" };
