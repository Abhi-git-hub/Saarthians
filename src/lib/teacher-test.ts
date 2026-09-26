"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

const recordSimpleSchema = z.object({
  studentId: z.string().uuid(),
  subject: z.string().trim().min(1).max(100),
  obtained: z.number().finite().min(0).max(10000),
  total: z.number().finite().positive().max(10000),
});

// The only scoring path: pick a student, type a subject and marks. The RPC
// files it under the student's profile. Obtained > total is rejected before
// anything touches the database.
export async function recordSimpleScore(input: unknown): Promise<{ attemptId: string }> {
  await requireRole(["teacher", "admin"]);
  const parsed = recordSimpleSchema.safeParse(input);
  if (!parsed.success) throw new Error("Enter a student, subject, and valid marks.");
  if (parsed.data.obtained > parsed.data.total) {
    throw new Error("Obtained marks cannot exceed total marks.");
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_score_simple", {
    p_student_id: parsed.data.studentId,
    p_subject: parsed.data.subject,
    p_obtained: parsed.data.obtained,
    p_total: parsed.data.total,
  });
  if (error || !data) {
    const code = error?.code ?? "";
    if (code === "42501") throw new Error("That student is not assigned to you.");
    throw new Error(`Unable to record the score (${code || "unknown"}).`);
  }
  return { attemptId: data as string };
}
