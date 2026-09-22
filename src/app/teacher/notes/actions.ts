"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

const noteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(50000),
  visibility: z.enum(["private", "shared", "published"]),
});

function revalidateNotes() {
  revalidatePath("/teacher/notes");
  revalidatePath("/app/notes");
}

export async function createTeacherNote(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const parsed = noteSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    visibility: formData.get("visibility"),
  });

  if (!parsed.success) throw new Error("INVALID_NOTE");

  const supabase = await createClient();
  const { error } = await supabase.from("notes").insert({
    owner_user_id: user.id,
    title: parsed.data.title,
    content: parsed.data.content,
    visibility: parsed.data.visibility,
    status: parsed.data.visibility === "published" ? "published" : "draft",
  });

  if (error) throw new Error("NOTE_CREATE_FAILED");
  revalidateNotes();
}

export async function updateTeacherNote(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const id = z.string().uuid().safeParse(formData.get("id"));
  const parsed = noteSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    visibility: formData.get("visibility"),
  });

  if (!id.success || !parsed.success) throw new Error("INVALID_NOTE");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .update({
      title: parsed.data.title,
      content: parsed.data.content,
      visibility: parsed.data.visibility,
      status: parsed.data.visibility === "published" ? "published" : "draft",
    })
    .eq("id", id.data)
    .eq("owner_user_id", user.id)
    .select("id");

  if (error || !data || data.length === 0) throw new Error("NOTE_UPDATE_FAILED");
  revalidateNotes();
}

export async function deleteTeacherNote(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) throw new Error("INVALID_NOTE");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id.data)
    .eq("owner_user_id", user.id)
    .select("id");

  if (error || !data || data.length === 0) throw new Error("NOTE_DELETE_FAILED");
  revalidateNotes();
}

const shareSchema = z.object({
  noteId: z.string().uuid(),
  studentId: z.string().uuid(),
});

async function assertOwnedNote(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, noteId: string) {
  const { data, error } = await supabase
    .from("notes")
    .select("id")
    .eq("id", noteId)
    .eq("owner_user_id", userId)
    .single();

  if (error || !data) throw new Error("NOTE_NOT_FOUND");
}

async function assertAssignedStudent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teacherId: string,
  studentId: string,
) {
  const { data, error } = await supabase
    .from("teacher_student")
    .select("teacher_id")
    .eq("teacher_id", teacherId)
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) throw new Error("STUDENT_NOT_ASSIGNED");
}

export async function shareTeacherNote(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const parsed = shareSchema.safeParse({
    noteId: formData.get("noteId"),
    studentId: formData.get("studentId"),
  });

  if (!parsed.success) throw new Error("INVALID_SHARE");

  const supabase = await createClient();
  await assertOwnedNote(supabase, user.id, parsed.data.noteId);
  await assertAssignedStudent(supabase, user.id, parsed.data.studentId);

  const { error } = await supabase.from("note_shares").upsert(
    {
      note_id: parsed.data.noteId,
      student_id: parsed.data.studentId,
      shared_by_user_id: user.id,
    },
    { onConflict: "note_id,student_id" },
  );

  if (error) throw new Error("NOTE_SHARE_FAILED");
  revalidateNotes();
}

export async function unshareTeacherNote(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const parsed = shareSchema.safeParse({
    noteId: formData.get("noteId"),
    studentId: formData.get("studentId"),
  });

  if (!parsed.success) throw new Error("INVALID_SHARE");

  const supabase = await createClient();
  await assertOwnedNote(supabase, user.id, parsed.data.noteId);

  const { data, error } = await supabase
    .from("note_shares")
    .delete()
    .eq("note_id", parsed.data.noteId)
    .eq("student_id", parsed.data.studentId)
    .select("note_id");

  if (error || !data || data.length === 0) throw new Error("NOTE_UNSHARE_FAILED");
  revalidateNotes();
}
