import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

// The student workspace is three pages now: notes, material, profile.
// /app lands on notes.
export default async function StudentWorkspace() {
  await requireRole(["student"]);
  redirect("/app/notes");
}
