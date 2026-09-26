"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

const noteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(50000),
});

// Notes are shared with everyone logged in: every note is published.
const SHARED_VISIBILITY = "published";

function revalidateNotes() {
  revalidatePath("/teacher/notes");
  revalidatePath("/app/notes");
}

export async function createTeacherNote(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const parsed = noteSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!parsed.success) throw new Error("INVALID_NOTE");

  const supabase = await createClient();
  const { error } = await supabase.from("notes").insert({
    owner_user_id: user.id,
    title: parsed.data.title,
    content: parsed.data.content,
    visibility: SHARED_VISIBILITY,
    status: "published",
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
  });

  if (!id.success || !parsed.success) throw new Error("INVALID_NOTE");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .update({
      title: parsed.data.title,
      content: parsed.data.content,
      visibility: SHARED_VISIBILITY,
      status: "published",
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
