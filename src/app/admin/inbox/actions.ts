"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export async function markMessageRead(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) throw new Error("INVALID_MESSAGE");
  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id.data)
    .is("read_at", null);
  if (error) throw new Error("MESSAGE_UPDATE_FAILED");
  revalidatePath("/admin/inbox");
}

export async function deleteMessage(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) throw new Error("INVALID_MESSAGE");
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").delete().eq("id", id.data);
  if (error) throw new Error("MESSAGE_DELETE_FAILED");
  revalidatePath("/admin/inbox");
}
