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
  if (error) throw new Error(`Unable to create the test (${error.code ?? "unknown"}).`);
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
  if (error) throw new Error(`Unable to save the question (${error.code ?? "unknown"}).`);
  return data as string;
}

export async function removeTeacherQuestion(questionId: string) {
  await requireRole(["teacher", "admin"]);
  if (!z.string().uuid().safeParse(questionId).success) throw new Error("Invalid question.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_test_question", { p_question_id: questionId });
  if (error) throw new Error(`Unable to delete the question (${error.code ?? "unknown"}).`);
}

export async function publishTeacherTest(testId: string) {
  await requireRole(["teacher", "admin"]);
  if (!z.string().uuid().safeParse(testId).success) throw new Error("Invalid test.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("publish_teacher_test", { p_test_id: testId });
  if (error) throw new Error(`Unable to publish the assessment (${error.code ?? "unknown"}).`);
}

const scheduleSchema = z.object({
  testId: z.string().uuid(),
  startTime: z.string().datetime({ offset: true }).nullable(),
  endTime: z.string().datetime({ offset: true }).nullable(),
});

// Teacher-controlled live window. Past-start or missing bounds simply widen
// the window; the server RPCs still enforce whatever is stored.
export async function scheduleTeacherTest(input: unknown) {
  await requireRole(["teacher", "admin"]);
  const parsed = scheduleSchema.parse(input);
  if (parsed.startTime && parsed.endTime && parsed.endTime <= parsed.startTime) {
    throw new Error("The window must end after it starts.");
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("schedule_test", {
    p_test_id: parsed.testId,
    p_start_time: parsed.startTime,
    p_end_time: parsed.endTime,
  });
  if (error) throw new Error(`Unable to schedule the assessment (${error.code ?? "unknown"}).`);
}

const maxMarksSchema = z.object({
  testId: z.string().uuid(),
  // Null clears back to question-derived max. Positive, sane ceiling.
  maxMarks: z.number().finite().positive().max(10000).nullable(),
});

// Ceiling for score-only (question-less) tests. Owner-checked both in the
// action (teacher_id match) and by RLS; the record RPC re-derives it anyway.
export async function setTestMaxMarks(input: unknown) {
  const user = await requireRole(["teacher", "admin"]);
  const parsed = maxMarksSchema.parse(input);
  const supabase = await createClient();
  let query = supabase.from("tests").update({ max_marks: parsed.maxMarks }).eq("id", parsed.testId).select("id");
  if (user.role !== "admin") query = query.eq("teacher_id", user.id);
  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    throw new Error("Unable to save max marks. The test was not found or is not yours.");
  }
}

const recordScoreSchema = z.object({
  testId: z.string().uuid(),
  studentId: z.string().uuid(),
  score: z.number().finite().min(0).max(10000),
});

// Record one student's offline-test score. The RPC enforces ownership,
// assignment, and 0 <= score <= max; this action only validates shape.
export async function recordStudentScore(input: unknown): Promise<string> {
  await requireRole(["teacher", "admin"]);
  const parsed = recordScoreSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_student_score", {
    p_test_id: parsed.testId,
    p_student_id: parsed.studentId,
    p_score: parsed.score,
  });
  if (error || !data) {
    const code = error?.code ?? "";
    if (code === "42501") throw new Error("That student is not assigned to you.");
    if (code === "22023") throw new Error("Check the test, student, and score values.");
    throw new Error(`Unable to record the score (${code || "unknown"}).`);
  }
  return data as string;
}
