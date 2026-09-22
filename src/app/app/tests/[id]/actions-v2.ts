"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

const uuid = z.string().uuid();

export async function startTestV2(testId: string) {
  await requireRole(["student"]);
  const parsed = uuid.safeParse(testId);
  if (!parsed.success) return { error: "Invalid test." };

  const supabase = await createClient();
  // Commit any expired attempts first (separate transaction: an RPC that
  // raises rolls its whole transaction back, so an in-RPC sweep alone could
  // never persist a finalization on these paths).
  await supabase.rpc("finalize_expired_attempts");
  const { data, error } = await supabase.rpc("start_test_attempt", { p_test_id: parsed.data });
  if (error || !data) return { error: "This test is not available." };

  const { data: attempt } = await supabase.from("test_attempts").select("id,started_at,deadline_at").eq("id", data as string).single();
  return {
    attemptId: data as string,
    startedAt: attempt?.started_at ?? new Date().toISOString(),
    deadlineAt: (attempt?.deadline_at as string | null) ?? null,
  };
}

export async function saveAnswerV2(input: { attemptId: string; questionId: string; answer: unknown }) {
  await requireRole(["student"]);
  const attempt = uuid.safeParse(input.attemptId);
  const question = uuid.safeParse(input.questionId);
  if (!attempt.success || !question.success) return { error: "Invalid answer." };

  const supabase = await createClient();
  await supabase.rpc("finalize_expired_attempts");
  const { error } = await supabase.rpc("save_test_answer", {
    p_attempt_id: attempt.data,
    p_question_id: question.data,
    p_answer: input.answer,
  });
  if (!error) return { ok: true as const };
  const code = `${error.message ?? ""} ${(error as { code?: string }).code ?? ""}`;
  if (code.includes("ATTEMPT_NOT_SAVABLE") || code.includes("ATTEMPT_TIME_EXPIRED")) {
    return { finalized: true as const };
  }
  return { error: "We couldn't save that answer." };
}

export async function submitTestV2(attemptId: string, testId: string, reason: "manual" | "auto_deadline" | "auto_leave" = "manual") {
  await requireRole(["student"]);
  const attempt = uuid.safeParse(attemptId);
  const test = uuid.safeParse(testId);
  if (!attempt.success || !test.success) return { error: "Invalid attempt." };

  const supabase = await createClient();
  await supabase.rpc("finalize_expired_attempts");
  const { data, error } = await supabase.rpc("submit_test_attempt", { p_attempt_id: attempt.data, p_reason: reason });
  if (error || !data?.[0]) {
    const code = `${error?.message ?? ""} ${(error as { code?: string } | null)?.code ?? ""}`;
    if (code.includes("ATTEMPT_NOT_SUBMITTABLE")) return { finalized: true as const };
    return { error: "We couldn't submit this attempt." };
  }

  revalidatePath("/app/tests");
  revalidatePath(`/app/tests/${test.data}`);
  revalidatePath("/app/results");
  revalidatePath("/app/progress");
  revalidatePath("/app");
  return { result: data[0] as { score: number; max_score: number; status: string } };
}

const securityEventSchema = z.object({
  attemptId: uuid,
  event: z.enum([
    "visibility_hidden",
    "visibility_visible",
    "focus_blur",
    "focus_focus",
    "fullscreen_exit",
    "fullscreen_enter",
    "heartbeat",
    "leave_finalize",
    "signout_finalize",
    "deadline_finalize",
  ]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Best-effort anti-cheating signal logging. Failures never block the player:
// these rows are evidence, not gates. The deadline RPCs remain authoritative.
export async function logSecurityEventV2(input: unknown): Promise<{ ok: boolean }> {
  try {
    await requireRole(["student"]);
  } catch {
    return { ok: false };
  }
  const parsed = securityEventSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  try {
    const supabase = await createClient();
    await supabase.rpc("log_test_security_event", {
      p_attempt_id: parsed.data.attemptId,
      p_event_type: parsed.data.event,
      p_metadata: (parsed.data.metadata ?? {}) as never,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
