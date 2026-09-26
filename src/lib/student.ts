import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

// Scores recorded by the teacher. A student reads only their own rows here;
// the profile page renders them as "my marks".
export async function getStudentAttempts() {
  const user = await requireRole(["student"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("test_attempts")
    .select("id,test_id,status,submission_reason,score,max_score,started_at,submitted_at,created_at,tests(title)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error("RESULTS_LOAD_FAILED");
  return data;
}
