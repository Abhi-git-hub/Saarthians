"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

const questionSchema = z.object({
  testId: z.string().uuid(),
  questionId: z.string().uuid().optional(),
  type: z.enum(["mcq", "short_answer"]),
  prompt: z.string().trim().min(1).max(5000),
  options: z.array(z.string().trim().min(1).max(500)).max(8).optional(),
  correct: z.unknown(),
  points: z.number().finite().min(0).max(1000),
  position: z.number().int().min(0).max(1000),
});

const testSchema = z.object({
  title: z.string().trim().min(1).max(200),
  instructions: z.string().trim().max(10000).default(""),
  durationSeconds: z.number().int().positive().max(86400).nullable().default(null),
});

export async function createTeacherTest(input: unknown) {
  await requireRole(["teacher", "admin"]);
  const parsed = testSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_teacher_test", {
    p_title: parsed.title,
    p_instructions: parsed.instructions,
    p_duration_seconds: parsed.durationSeconds,
  });
  if (error) throw new Error("Unable to create the test.");
  return data as string;
}

export async function saveTeacherQuestion(input: unknown) {
  await requireRole(["teacher", "admin"]);
  const parsed = questionSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("upsert_test_question", {
    p_question_id: parsed.questionId ?? null,
    p_test_id: parsed.testId,
    p_type: parsed.type,
    p_prompt: parsed.prompt,
    p_options: parsed.options ?? null,
    p_correct: parsed.correct,
    p_points: parsed.points,
    p_position: parsed.position,
  });
  if (error) throw new Error("Unable to save the question.");
  return data as string;
}

export async function removeTeacherQuestion(questionId: string) {
  await requireRole(["teacher", "admin"]);
  if (!z.string().uuid().safeParse(questionId).success) throw new Error("Invalid question.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_test_question", { p_question_id: questionId });
  if (error) throw new Error("Unable to delete the question.");
}

export async function publishTeacherTest(testId: string) {
  await requireRole(["teacher", "admin"]);
  if (!z.string().uuid().safeParse(testId).success) throw new Error("Invalid test.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("publish_teacher_test", { p_test_id: testId });
  if (error) throw new Error("Unable to publish the test.");
}
