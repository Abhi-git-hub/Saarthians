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

export type NoteListItem = {
  id: string;
  title: string;
  content: string;
  owner_user_id: string;
  created_at: string | null;
  updated_at: string | null;
  owner_name: string;
};

export type NoteImage = {
  id: string;
  url: string;
};

export type NoteDetail = NoteListItem & {
  images: NoteImage[];
  isOwner: boolean;
};

const ROLES = ["student", "teacher", "admin"] as const;

// Notes are the shared class notebook: every logged-in user reads every
// note (the RLS policy notes_shared_read enforces the same boundary in the
// database). Owners are named so the library feels written by real people.
export async function getAllNotes(search?: string): Promise<NoteListItem[]> {
  await requireRole([...ROLES]);
  const supabase = await createClient();
  let query = supabase
    .from("notes")
    .select("id,title,content,owner_user_id,created_at,updated_at,profiles:owner_user_id(display_name)")
    .order("updated_at", { ascending: false });

  const pattern = toFilterTerm(search);
  if (pattern) {
    query = query.or(`title.ilike.${pattern},content.ilike.${pattern}`);
  }

  const { data, error } = await query;
  if (error) throw new Error("NOTES_LOAD_FAILED");
  return (data ?? []).map((note) => {
    const profile = Array.isArray(note.profiles) ? note.profiles[0] : note.profiles;
    return {
      id: note.id,
      title: note.title,
      content: note.content,
      owner_user_id: note.owner_user_id,
      created_at: note.created_at,
      updated_at: note.updated_at,
      owner_name: profile?.display_name ?? "Saarthians",
    };
  });
}

// One note with its pictures. Pictures live in a private bucket, so each
// read mints short-lived signed URLs — the image carries the same
// logged-in-only visibility as the note text.
export async function getNoteDetail(noteId: string): Promise<NoteDetail | null> {
  const user = await requireRole([...ROLES]);
  const supabase = await createClient();
  const { data: note, error } = await supabase
    .from("notes")
    .select("id,title,content,owner_user_id,created_at,updated_at,profiles:owner_user_id(display_name)")
    .eq("id", noteId)
    .single();

  if (error || !note) return null;

  const { data: rows } = await supabase
    .from("note_images")
    .select("id,storage_path")
    .eq("note_id", noteId)
    .order("position", { ascending: true });

  const images: NoteImage[] = [];
  for (const row of rows ?? []) {
    const { data } = await supabase.storage.from("note-images").createSignedUrl(row.storage_path, 3600);
    if (data?.signedUrl) images.push({ id: row.id, url: data.signedUrl });
  }

  const profile = Array.isArray(note.profiles) ? note.profiles[0] : note.profiles;
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    owner_user_id: note.owner_user_id,
    created_at: note.created_at,
    updated_at: note.updated_at,
    owner_name: profile?.display_name ?? "Saarthians",
    images,
    isOwner: note.owner_user_id === user.id || user.role === "admin",
  };
}
