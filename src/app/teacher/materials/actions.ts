"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MATERIAL_BUCKET, retryMaterialProcessing } from "@/lib/materials/service";

const idSchema = z.string().uuid();

async function ownMaterial(materialId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("study_materials")
    .select("id,storage_path,processing_status")
    .eq("id", materialId)
    .eq("teacher_id", userId)
    .single();
  if (error || !data) throw new Error("MATERIAL_NOT_FOUND");
  return { supabase, material: data };
}

export async function retryMaterial(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) throw new Error("INVALID_MATERIAL");
  const { supabase, material } = await ownMaterial(parsed.data, user.id);
  if (material.processing_status === "ready") throw new Error("MATERIAL_ALREADY_READY");
  if (!material.storage_path) throw new Error("MATERIAL_HAS_NO_FILE");
  await retryMaterialProcessing(supabase, {
    materialId: material.id,
    teacherId: user.id,
    storagePath: material.storage_path,
  });
  revalidatePath("/teacher/materials");
  redirect(`/teacher/materials/${material.id}`);
}

export async function deleteMaterial(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) throw new Error("INVALID_MATERIAL");
  const { supabase, material } = await ownMaterial(parsed.data, user.id);
  if (material.storage_path) {
    const prefix = material.storage_path.split("/").slice(0, 2).join("/");
    const { data: objects } = await supabase.storage.from(MATERIAL_BUCKET).list(prefix, { limit: 100 });
    if (objects && objects.length > 0) {
      await supabase.storage
        .from(MATERIAL_BUCKET)
        .remove(objects.map((o) => `${prefix}/${o.name}`));
    }
  }
  const { error } = await supabase.from("study_materials").delete().eq("id", material.id);
  if (error) throw new Error("MATERIAL_DELETE_FAILED");
  revalidatePath("/teacher/materials");
  redirect("/teacher/materials");
}
