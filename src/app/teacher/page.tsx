import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

// The teacher workspace is three pages now: notes, material, marks.
// /teacher lands on notes.
export default async function TeacherWorkspace() {
  await requireRole(["teacher", "admin"]);
  redirect("/teacher/notes");
}
