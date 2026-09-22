import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export type TeacherNoteShare = {
  student_id: string;
  display_name: string;
};

export async function getTeacherNotes(search?: string) {
  const user = await requireRole(["teacher", "admin"]);
  const supabase = await createClient();
  let query = supabase
    .from("notes")
    .select("id,title,content,visibility,status,created_at,updated_at")
    .eq("owner_user_id", user.id)
    .order("updated_at", { ascending: false });

  const term = search?.trim().slice(0, 120).replace(/[,()]/g, " ").trim();
  if (term) {
    const pattern = `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
    query = query.or(`title.ilike.${pattern},content.ilike.${pattern}`);
  }

  const { data, error } = await query;
  if (error) throw new Error("NOTES_LOAD_FAILED");
  return data;
}

export async function getTeacherNoteShares(noteId: string): Promise<TeacherNoteShare[]> {
  const user = await requireRole(["teacher", "admin"]);
  const supabase = await createClient();
  const { data: note, error: noteError } = await supabase
    .from("notes")
    .select("id")
    .eq("id", noteId)
    .eq("owner_user_id", user.id)
    .single();

  if (noteError || !note) throw new Error("NOTE_NOT_FOUND");

  const { data, error } = await supabase
    .from("note_shares")
    .select("student_id,profiles:student_id(display_name)")
    .eq("note_id", noteId);

  if (error) throw new Error("NOTES_LOAD_FAILED");
  return (data ?? []).map((share) => {
    const profile = Array.isArray(share.profiles) ? share.profiles[0] : share.profiles;
    return { student_id: share.student_id, display_name: profile?.display_name ?? "Unnamed student" };
  });
}

export async function getShareableStudents() {
  const user = await requireRole(["teacher", "admin"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_student")
    .select("student_id,profiles:student_id(id,display_name)")
    .eq("teacher_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) throw new Error("TEACHER_DATA_UNAVAILABLE");
  return (data ?? [])
    .map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return { id: row.student_id, display_name: profile?.display_name ?? "Unnamed student" };
    })
    .filter((student, index, all) => all.findIndex((other) => other.id === student.id) === index);
}
