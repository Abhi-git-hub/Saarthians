import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireRole: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { shareTeacherNote, unshareTeacherNote } from "./actions";

const TEACHER_ID = "11111111-1111-4111-8111-111111111111";
const NOTE_ID = "22222222-2222-4222-8222-222222222222";
const STUDENT_ID = "33333333-3333-4333-8333-333333333333";

class Chain {
  private result: unknown;
  constructor(result: unknown) {
    this.result = result;
  }
  select() { return this; }
  insert() { return this; }
  update() { return this; }
  delete() { return this; }
  upsert() { return this; }
  eq() { return this; }
  order() { return this; }
  limit() { return this; }
  single() { return this; }
  maybeSingle() { return this; }
  then(resolve: (value: unknown) => void) {
    resolve(this.result);
  }
}

function mockDb(queues: Record<string, unknown[]>) {
  const from = vi.fn((table: string) => {
    const queue = queues[table] ?? [];
    const result = queue.length > 0 ? queue.shift() : { data: null, error: null };
    return new Chain(result);
  });
  vi.mocked(createClient).mockResolvedValue({ from } as never);
  vi.mocked(requireRole).mockResolvedValue({ id: TEACHER_ID } as never);
  return { from };
}

function shareForm(noteId: string, studentId: string) {
  const form = new FormData();
  form.set("noteId", noteId);
  form.set("studentId", studentId);
  return form;
}

describe("teacher note sharing authorization", () => {
  it("rejects malformed ids without touching the database", async () => {
    const { from } = mockDb({});
    await expect(shareTeacherNote(shareForm("nope", STUDENT_ID))).rejects.toThrow("INVALID_SHARE");
    await expect(unshareTeacherNote(shareForm(NOTE_ID, "nope"))).rejects.toThrow("INVALID_SHARE");
    expect(from).not.toHaveBeenCalled();
  });

  it("refuses to share a note the teacher does not own", async () => {
    mockDb({ notes: [{ data: null, error: { message: "none" } }] });
    await expect(shareTeacherNote(shareForm(NOTE_ID, STUDENT_ID))).rejects.toThrow("NOTE_NOT_FOUND");
  });

  it("refuses to share with an unassigned student", async () => {
    mockDb({
      notes: [{ data: { id: NOTE_ID }, error: null }],
      teacher_student: [{ data: null, error: null }],
    });
    await expect(shareTeacherNote(shareForm(NOTE_ID, STUDENT_ID))).rejects.toThrow("STUDENT_NOT_ASSIGNED");
  });

  it("shares with an assigned student and unshares cleanly", async () => {
    mockDb({
      notes: [{ data: { id: NOTE_ID }, error: null }],
      teacher_student: [{ data: { teacher_id: TEACHER_ID }, error: null }],
      note_shares: [{ error: null }],
    });
    await expect(shareTeacherNote(shareForm(NOTE_ID, STUDENT_ID))).resolves.toBeUndefined();

    mockDb({
      notes: [{ data: { id: NOTE_ID }, error: null }],
      note_shares: [{ data: [{ note_id: NOTE_ID }], error: null }],
    });
    await expect(unshareTeacherNote(shareForm(NOTE_ID, STUDENT_ID))).resolves.toBeUndefined();
  });

  it("propagates authorization failure before any data access", async () => {
    const { from } = mockDb({});
    vi.mocked(requireRole).mockRejectedValue(new Error("REDIRECT:/login"));
    await expect(shareTeacherNote(shareForm(NOTE_ID, STUDENT_ID))).rejects.toThrow("REDIRECT:/login");
    expect(from).not.toHaveBeenCalled();
  });
});
