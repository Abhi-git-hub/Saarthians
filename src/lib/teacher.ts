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
