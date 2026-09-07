import { createClient } from "@/lib/supabase/server";

export async function getTeacherStudents(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_student")
    .select("student_id,status,created_at,profiles:student_id(id,display_name,status)")
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

export async function getTeacherResults(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("test_attempts")
    .select("id,student_id,test_id,status,score,max_score,submitted_at,tests!inner(id,title,teacher_id),profiles:student_id(display_name)")
    .eq("tests.teacher_id", userId)
    .in("status", ["graded", "reviewed"])
    .order("submitted_at", { ascending: false });

  if (error) throw new Error("TEACHER_DATA_UNAVAILABLE");
  return data ?? [];
}
