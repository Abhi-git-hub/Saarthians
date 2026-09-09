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

export async function createNote(formData: FormData) {
  const user = await requireRole(["student"]);
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
  revalidatePath("/app");
  revalidatePath("/app/notes");
}

export async function updateNote(formData: FormData) {
  const user = await requireRole(["student"]);
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
  revalidatePath("/app");
  revalidatePath("/app/notes");
}

export async function deleteNote(formData: FormData) {
  const user = await requireRole(["student"]);
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
  revalidatePath("/app");
  revalidatePath("/app/notes");
}
