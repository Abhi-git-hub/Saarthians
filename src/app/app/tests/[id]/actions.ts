"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

const uuid = z.string().uuid();

export async function startTest(testId: string) {
  await requireRole(["student"]);
  const parsed = uuid.safeParse(testId);
  if (!parsed.success) return { error: "Invalid test." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_test_attempt", { p_test_id: parsed.data });
  if (error) return { error: "This test is not available." };
  return { attemptId: data as string };
}

export async function saveAnswer(input: { attemptId: string; questionId: string; answer: unknown }) {
  await requireRole(["student"]);
  const attempt = uuid.safeParse(input.attemptId);
  const question = uuid.safeParse(input.questionId);
  if (!attempt.success || !question.success) return { error: "Invalid answer." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_test_answer", {
    p_attempt_id: attempt.data,
    p_question_id: question.data,
    p_answer: input.answer,
  });
  return error ? { error: "We couldn't save that answer." } : { ok: true };
}

export async function submitTest(attemptId: string, testId: string) {
  await requireRole(["student"]);
  const attempt = uuid.safeParse(attemptId);
  const test = uuid.safeParse(testId);
  if (!attempt.success || !test.success) return { error: "Invalid attempt." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_test_attempt", { p_attempt_id: attempt.data });
  if (error || !data?.[0]) return { error: "We couldn't submit this attempt." };

  revalidatePath("/app/tests");
  revalidatePath(`/app/tests/${test.data}`);
  revalidatePath("/app/results");
  revalidatePath("/app/progress");
  revalidatePath("/app");
  return { result: data[0] as { score: number; max_score: number; status: string } };
}
