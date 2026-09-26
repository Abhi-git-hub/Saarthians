"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export const NOTE_IMAGE_BUCKET = "note-images";
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 10;
const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

function revalidateNotes() {
  revalidatePath("/app/notes");
  revalidatePath("/teacher/notes");
}

async function assertEditableNote(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  isAdmin: boolean,
  noteId: string,
) {
  if (!z.string().uuid().safeParse(noteId).success) throw new Error("INVALID_NOTE");
  const { data: note, error } = await supabase
    .from("notes")
    .select("id,owner_user_id")
    .eq("id", noteId)
    .single();
  if (error || !note) throw new Error("NOTE_NOT_FOUND");
  if (!isAdmin && note.owner_user_id !== userId) throw new Error("You can only change your own notes.");
  return note;
}

// Attach a picture to your own note. Store-first, then row — if the row
// insert fails the orphaned object is removed so storage never drifts.
export async function addNoteImage(noteId: string, formData: FormData): Promise<void> {
  const user = await requireRole(["student", "teacher", "admin"]);
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) throw new Error("Pick a picture first.");
  if (file.size > MAX_BYTES) throw new Error("Pictures must be 5 MB or smaller.");
  const ext = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
  if (!ext) throw new Error("Only JPG, PNG, or WebP pictures.");

  const supabase = await createClient();
  await assertEditableNote(supabase, user.id, user.role === "admin", noteId);

  const { count } = await supabase
    .from("note_images")
    .select("id", { count: "exact", head: true })
    .eq("note_id", noteId);
  if ((count ?? 0) >= MAX_IMAGES) throw new Error("A note holds at most 10 pictures.");

  const path = `${user.id}/${noteId}/${randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(NOTE_IMAGE_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error("Could not store the picture. Check your connection and retry.");

  const { error: rowError } = await supabase
    .from("note_images")
    .insert({ note_id: noteId, storage_path: path, position: count ?? 0 });
  if (rowError) {
    await supabase.storage.from(NOTE_IMAGE_BUCKET).remove([path]);
    throw new Error("Could not attach the picture. Retry.");
  }
  revalidateNotes();
}

export async function removeNoteImage(imageId: string): Promise<void> {
  const user = await requireRole(["student", "teacher", "admin"]);
  if (!z.string().uuid().safeParse(imageId).success) throw new Error("INVALID_IMAGE");
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("note_images")
    .select("id,note_id,storage_path")
    .eq("id", imageId)
    .single();
  if (error || !row) throw new Error("IMAGE_NOT_FOUND");
  await assertEditableNote(supabase, user.id, user.role === "admin", row.note_id);

  const { error: rowError } = await supabase.from("note_images").delete().eq("id", imageId);
  if (rowError) throw new Error("Could not remove the picture. Retry.");
  await supabase.storage.from(NOTE_IMAGE_BUCKET).remove([row.storage_path]);
  revalidateNotes();
}
