"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import {
  adminErrorMessage,
  provisionUserSchema,
  relationshipSchema,
  setStatusSchema,
  updateProfileSchema,
} from "@/lib/admin-validation";

type ActionResult = { ok: true; userId?: string; username?: string } | { error: string };

function formValues(formData: FormData) {
  return Object.fromEntries(
    [...formData.keys()].map((key) => [key, String(formData.get(key) ?? "")]),
  );
}

// Provision a student or teacher through the provision-user Edge Function —
// the single audited provisioning path. The function verifies the caller is an
// active admin, creates the auth account with its service-role client, writes
// the profile via admin_provision_profile, and rolls the auth user back if the
// profile step fails. This action only validates input server-side first and
// forwards the request with the admin's own session.
export async function provisionAccount(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin"]);
  const values = formValues(formData);
  const parsed = provisionUserSchema.safeParse({
    username: values.username,
    displayName: values.displayName,
    password: values.password,
    role: values.role,
    phone: values.phone || undefined,
    gradeLevel: values.gradeLevel || undefined,
    subject: values.subject || undefined,
  });
  if (!parsed.success) {
    return { error: "Check the highlighted details and try again." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.functions.invoke("provision-user", {
      body: {
        username: parsed.data.username,
        displayName: parsed.data.displayName,
        password: parsed.data.password,
        role: parsed.data.role,
        phone: parsed.data.phone || null,
        gradeLevel: parsed.data.gradeLevel || null,
        subject: parsed.data.subject || null,
      },
    });
    if (error) throw error;
    if (!data?.ok) throw new Error(typeof data?.error === "string" ? data.error : "PROVISION_FAILED");
    revalidatePath("/admin");
    revalidatePath("/admin/users");
    return { ok: true, userId: data.user?.id, username: data.user?.username };
  } catch (error) {
    return { error: adminErrorMessage(error) };
  }
}

export async function setUserStatus(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin"]);
  const parsed = setStatusSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: "Invalid status change." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_set_profile_status", {
      p_user_id: parsed.data.userId,
      p_status: parsed.data.status,
    });
    if (error) throw error;
  } catch (error) {
    return { error: adminErrorMessage(error) };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateUserProfile(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin"]);
  const values = formValues(formData);
  const parsed = updateProfileSchema.safeParse({
    userId: values.userId,
    displayName: values.displayName,
    phone: values.phone || undefined,
    gradeLevel: values.gradeLevel || undefined,
    subject: values.subject || undefined,
  });
  if (!parsed.success) return { error: "Enter a display name between 1 and 120 characters." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_update_profile", {
      p_user_id: parsed.data.userId,
      p_display_name: parsed.data.displayName,
      p_phone: parsed.data.phone || null,
      p_grade_level: parsed.data.gradeLevel || null,
      p_subject: parsed.data.subject || null,
    });
    if (error) throw error;
  } catch (error) {
    return { error: adminErrorMessage(error) };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function assignRelationship(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin"]);
  const parsed = relationshipSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: "Select a valid teacher and student." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_assign_teacher_student", {
      p_teacher_id: parsed.data.teacherId,
      p_student_id: parsed.data.studentId,
    });
    if (error) throw error;
  } catch (error) {
    return { error: adminErrorMessage(error) };
  }

  revalidatePath("/admin/relationships");
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function unassignRelationship(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin"]);
  const parsed = relationshipSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: "Invalid relationship." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_unassign_teacher_student", {
      p_teacher_id: parsed.data.teacherId,
      p_student_id: parsed.data.studentId,
    });
    if (error) throw error;
  } catch (error) {
    return { error: adminErrorMessage(error) };
  }

  revalidatePath("/admin/relationships");
  revalidatePath("/admin/users");
  return { ok: true };
}
