import { createClient } from "@/lib/supabase/server";

export async function getTeacherStudents(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_student")
    .select("student_id,status,created_at,profiles:student_id(id,display_name,status,grade_level)")
    .eq("teacher_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) throw new Error("TEACHER_DATA_UNAVAILABLE");
  return data ?? [];
}

export async function getTeacherTests(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tests")
    .select("id,title,instructions,duration_seconds,status,published_at,created_at,test_questions(id,position,points)")
    .eq("teacher_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("TEACHER_DATA_UNAVAILABLE");
  return data ?? [];
}

export async function getTeacherStudentDetail(teacherId: string, studentId: string) {
  const supabase = await createClient();
  const { data: link, error: linkError } = await supabase
    .from("teacher_student")
    .select("status,created_at")
    .eq("teacher_id", teacherId)
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();

  if (linkError || !link) throw new Error("STUDENT_NOT_ASSIGNED");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,display_name,status,created_at")
    .eq("id", studentId)
    .single();

  if (profileError || !profile) throw new Error("STUDENT_NOT_FOUND");

  const { data: attempts, error: attemptsError } = await supabase
    .from("test_attempts")
    .select("id,test_id,status,score,max_score,submitted_at,tests(title)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (attemptsError) throw new Error("TEACHER_DATA_UNAVAILABLE");

  const { data: notes, error: notesError } = await supabase
    .from("notes")
    .select("id,title,updated_at")
    .eq("owner_user_id", teacherId)
    .order("updated_at", { ascending: false })
    .limit(5);

  if (notesError) throw new Error("TEACHER_DATA_UNAVAILABLE");

  return { link, profile, attempts: attempts ?? [], notes: notes ?? [] };
}

export async function getTeacherProgressOverview(userId: string) {
  const results = await getTeacherResults(userId);
  const byTest = new Map<string, { title: string; attempts: number; best: number | null; latest: number | null }>();

  for (const result of results) {
    const test = Array.isArray(result.tests) ? result.tests[0] : result.tests;
    if (!test?.title || result.score === null || result.max_score === null) continue;
    const percent = Math.round((Number(result.score) / Math.max(Number(result.max_score), 1)) * 100);
    const existing = byTest.get(result.test_id);
    if (!existing) {
      byTest.set(result.test_id, { title: test.title, attempts: 1, best: percent, latest: percent });
    } else {
      existing.attempts += 1;
      existing.best = Math.max(existing.best ?? percent, percent);
    }
  }

  const students = await getTeacherStudents(userId);
  const tests = await getTeacherTests(userId);
  return { byTest: [...byTest.values()], studentCount: students.length, testCount: tests.length };
}

export async function getTeacherResults(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("test_attempts")
    .select("id,student_id,test_id,status,submission_reason,score,max_score,submitted_at,tests!inner(id,title,teacher_id),profiles:student_id(display_name)")
    .eq("tests.teacher_id", userId)
    .in("status", ["graded", "reviewed", "submitted"])
    .order("submitted_at", { ascending: false });

  if (error) throw new Error("TEACHER_DATA_UNAVAILABLE");
  const attempts = data ?? [];
  const ids = attempts.map((attempt) => attempt.id);
  let signals: Record<string, { focusLoss: number; fullscreenExits: number; heartbeats: number }> = {};
  if (ids.length > 0) {
    const { data: events } = await supabase
      .from("test_security_events")
      .select("attempt_id,event_type")
      .in("attempt_id", ids);
    for (const event of events ?? []) {
      const entry = (signals[event.attempt_id] ??= { focusLoss: 0, fullscreenExits: 0, heartbeats: 0 });
      if (event.event_type === "visibility_hidden" || event.event_type === "focus_blur") entry.focusLoss += 1;
      if (event.event_type === "fullscreen_exit") entry.fullscreenExits += 1;
      if (event.event_type === "heartbeat") entry.heartbeats += 1;
    }
  }
  return attempts.map((attempt) => ({
    ...attempt,
    signals: signals[attempt.id] ?? { focusLoss: 0, fullscreenExits: 0, heartbeats: 0 },
  }));
}
