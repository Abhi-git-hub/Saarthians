import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export async function getStudentNotes() {
  const user = await requireRole(["student"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("id,title,content,visibility,status,created_at,updated_at")
    .eq("owner_user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw new Error("NOTES_LOAD_FAILED");
  return data;
}

export async function getStudentTests() {
  const user = await requireRole(["student"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tests")
    .select("id,title,instructions,duration_seconds,published_at,teacher_id")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) throw new Error("TESTS_LOAD_FAILED");
  return data.filter(Boolean).map((test) => ({ ...test, studentId: user.id }));
}

export async function getStudentAttempts() {
  const user = await requireRole(["student"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("test_attempts")
    .select("id,test_id,status,score,max_score,started_at,submitted_at,created_at,tests(title)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error("RESULTS_LOAD_FAILED");
  return data;
}
