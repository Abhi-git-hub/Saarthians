import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireRole: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { recordStudentScore, setTestMaxMarks } from "./teacher-test";

const TEST_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const STUDENT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const TEACHER_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function mockRpc(result: unknown) {
  const rpc = vi.fn().mockResolvedValue(result);
  // Mirrors the query shape: update().eq().select().eq() → await.
  const terminalEq = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ eq: terminalEq });
  const firstEq = vi.fn().mockReturnValue({ select });
  const update = vi.fn().mockReturnValue({ eq: firstEq });
  vi.mocked(createClient).mockResolvedValue({ rpc, from: vi.fn().mockReturnValue({ update }) } as never);
  vi.mocked(requireRole).mockResolvedValue({ id: TEACHER_ID, role: "teacher" } as never);
  return { rpc, update, firstEq, select, terminalEq, setResult: (r: unknown) => terminalEq.mockResolvedValue(r) };
}

describe("recordStudentScore", () => {
  it("rejects malformed input before touching the database", async () => {
    const { rpc } = mockRpc({});
    await expect(recordStudentScore({ testId: "nope", studentId: STUDENT_ID, score: 5 })).rejects.toThrow();
    await expect(recordStudentScore({ testId: TEST_ID, studentId: STUDENT_ID, score: -1 })).rejects.toThrow();
    await expect(recordStudentScore({ testId: TEST_ID, studentId: STUDENT_ID, score: 20000 })).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("records via RPC and surfaces authorization distinctly", async () => {
    const { rpc } = mockRpc({ data: "attempt-id", error: null });
    const id = await recordStudentScore({ testId: TEST_ID, studentId: STUDENT_ID, score: 42 });
    expect(id).toBe("attempt-id");
    expect(rpc).toHaveBeenCalledWith("record_student_score", {
      p_test_id: TEST_ID,
      p_student_id: STUDENT_ID,
      p_score: 42,
    });

    mockRpc({ data: null, error: { code: "42501", message: "nope" } });
    await expect(recordStudentScore({ testId: TEST_ID, studentId: STUDENT_ID, score: 1 })).rejects.toThrow(
      /not assigned/,
    );
  });

  it("requires the teacher role", async () => {
    vi.mocked(requireRole).mockRejectedValue(new Error("REDIRECT:/login"));
    await expect(recordStudentScore({ testId: TEST_ID, studentId: STUDENT_ID, score: 1 })).rejects.toThrow(
      "REDIRECT:/login",
    );
  });
});

describe("setTestMaxMarks", () => {
  it("validates bounds and scopes the update to the owner", async () => {
    const { update, firstEq, select, terminalEq, setResult } = mockRpc({});
    setResult({ data: [{ id: TEST_ID }], error: null });
    await setTestMaxMarks({ testId: TEST_ID, maxMarks: 50 });
    expect(update).toHaveBeenCalledWith({ max_marks: 50 });
    expect(firstEq).toHaveBeenCalledWith("id", TEST_ID);
    expect(select).toHaveBeenCalledWith("id");
    expect(terminalEq).toHaveBeenCalledWith("teacher_id", TEACHER_ID);

    await expect(setTestMaxMarks({ testId: TEST_ID, maxMarks: -5 })).rejects.toThrow();
    await expect(setTestMaxMarks({ testId: TEST_ID, maxMarks: 99999 })).rejects.toThrow();
  });

  it("clears the ceiling with null and errors when nothing matches", async () => {
    const { setResult } = mockRpc({});
    setResult({ data: [{ id: TEST_ID }], error: null });
    await setTestMaxMarks({ testId: TEST_ID, maxMarks: null });

    setResult({ data: [], error: null });
    await expect(setTestMaxMarks({ testId: TEST_ID, maxMarks: 10 })).rejects.toThrow(/not yours/);
  });
});
