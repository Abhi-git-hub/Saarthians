"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createTest(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const title = String(formData.get("title") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "");
  const duration = String(formData.get("duration") ?? "").trim();
  const durationSeconds = duration ? Number(duration) * 60 : null;

  if (title.length < 1 || title.length > 200) throw new Error("INVALID_TITLE");
  if (durationSeconds !== null && (!Number.isInteger(durationSeconds) || durationSeconds <= 0)) throw new Error("INVALID_DURATION");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_teacher_test", {
    p_title: title,
    p_instructions: instructions,
    p_duration_seconds: durationSeconds,
  });

  if (error || !data) throw new Error("TEST_CREATION_FAILED");
  revalidatePath("/teacher/tests");
  redirect(`/teacher/tests/${data}/edit`);
}

export async function publishTest(testId: string) {
  await requireRole(["teacher", "admin"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("publish_teacher_test", { p_test_id: testId });
  if (error) throw new Error("TEST_PUBLISH_FAILED");
  revalidatePath("/teacher/tests");
  revalidatePath("/app/tests");
}
