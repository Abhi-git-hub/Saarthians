import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireRole: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { recordSimpleScore } from "./teacher-test";

const STUDENT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const TEACHER_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function mockRpc(result: unknown) {
  const rpc = vi.fn().mockResolvedValue(result);
  vi.mocked(createClient).mockResolvedValue({ rpc } as never);
  vi.mocked(requireRole).mockResolvedValue({ id: TEACHER_ID, role: "teacher" } as never);
  return { rpc };
}

describe("recordSimpleScore", () => {
  it("rejects bad shapes and obtained-above-total before the database", async () => {
    const { rpc } = mockRpc({});
    await expect(recordSimpleScore({ studentId: STUDENT_ID, subject: "  ", obtained: 5, total: 10 })).rejects.toThrow();
    await expect(recordSimpleScore({ studentId: STUDENT_ID, subject: "Maths", obtained: 11, total: 10 })).rejects.toThrow(
      /cannot exceed/,
    );
    await expect(recordSimpleScore({ studentId: "nope", subject: "Maths", obtained: 5, total: 10 })).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("records through the simple RPC", async () => {
    const { rpc } = mockRpc({ data: "attempt-9", error: null });
    const result = await recordSimpleScore({ studentId: STUDENT_ID, subject: " Physics ", obtained: 8, total: 10 });
    expect(result).toEqual({ attemptId: "attempt-9" });
    expect(rpc).toHaveBeenCalledWith("record_score_simple", {
      p_student_id: STUDENT_ID,
      p_subject: "Physics",
      p_obtained: 8,
      p_total: 10,
    });
  });

  it("requires the teacher role", async () => {
    vi.mocked(requireRole).mockRejectedValue(new Error("REDIRECT:/login"));
    await expect(recordSimpleScore({ studentId: STUDENT_ID, subject: "Maths", obtained: 5, total: 10 })).rejects.toThrow(
      "REDIRECT:/login",
    );
  });
});
