import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

// Escape LIKE wildcards so search input is matched literally.
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

// Sanitize a search term for use inside a PostgREST `or()` filter, where
// commas and parentheses would corrupt the filter syntax. Returns null when
// nothing searchable remains.
export function toFilterTerm(search: string | undefined): string | null {
  const term = search?.trim().slice(0, 120).replace(/[,()]/g, " ").trim();
  return term ? `%${escapeLikePattern(term)}%` : null;
}

export async function getStudentNotes(search?: string) {
  const user = await requireRole(["student"]);
  const supabase = await createClient();
  let query = supabase
    .from("notes")
    .select("id,title,content,visibility,status,created_at,updated_at")
    .eq("owner_user_id", user.id)
    .order("updated_at", { ascending: false });

  const pattern = toFilterTerm(search);
  if (pattern) {
    query = query.or(`title.ilike.${pattern},content.ilike.${pattern}`);
  }

  const { data, error } = await query;
  if (error) throw new Error("NOTES_LOAD_FAILED");
  return data;
}

// Notes shared with the student by teachers (via note_shares) plus published
// notes. Read access is enforced by RLS (notes_shared_read); this only shapes
// the listing, never the authorization.
export async function getSharedNotes(search?: string) {
  const user = await requireRole(["student"]);
  const supabase = await createClient();
  const { data: shares, error: sharesError } = await supabase
    .from("note_shares")
    .select("note_id")
    .eq("student_id", user.id);

  if (sharesError) throw new Error("NOTES_LOAD_FAILED");
  const sharedIds = (shares ?? []).map((share) => share.note_id).filter(Boolean);
  if (sharedIds.length === 0) return [];

  let query = supabase
    .from("notes")
    .select("id,title,content,visibility,status,created_at,updated_at")
    .in("id", sharedIds)
    .order("updated_at", { ascending: false });

  const sharedPattern = toFilterTerm(search);
  if (sharedPattern) {
    query = query.or(`title.ilike.${sharedPattern},content.ilike.${sharedPattern}`);
  }

  const { data, error } = await query;
  if (error) throw new Error("NOTES_LOAD_FAILED");
  return data ?? [];
}

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
