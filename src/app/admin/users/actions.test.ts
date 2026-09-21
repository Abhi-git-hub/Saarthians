import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireRole: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import {
  assignRelationship,
  provisionAccount,
  setUserStatus,
  unassignRelationship,
  updateUserProfile,
} from "./actions";
import { asSafeProvisionMessage, mapProvisionInvokeError } from "./provision-errors";

const TEACHER_ID = "11111111-1111-4111-8111-111111111111";
const STUDENT_ID = "22222222-2222-4222-8222-222222222222";

function asAdmin() {
  vi.mocked(requireRole).mockResolvedValue({
    id: "admin-id",
    displayName: "Admin",
    role: "admin",
  });
}

function asNonAdmin() {
  vi.mocked(requireRole).mockRejectedValue(new Error("REDIRECT:/app"));
}

const FAKE_TOKEN = "tok-test-access-token-abc123";

function mockClient(overrides: Record<string, unknown> = {}) {
  const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
  const invoke = vi.fn().mockResolvedValue({ data: { ok: true, user: { id: "new-id", username: "new.user" } }, error: null });
  const getSession = vi.fn().mockResolvedValue({ data: { session: { access_token: FAKE_TOKEN } } });
  vi.mocked(createClient).mockResolvedValue({
    auth: { getSession },
    rpc,
    functions: { invoke },
    ...overrides,
  } as never);
  return { rpc, invoke, getSession };
}

function provisionForm(overrides: Record<string, string> = {}) {
  const form = new FormData();
  form.set("username", "new.user");
  form.set("displayName", "New User");
  form.set("password", "initial-pass-1");
  form.set("role", "student");
  form.set("phone", "");
  form.set("gradeLevel", "Class 9");
  form.set("subject", "");
  for (const [key, value] of Object.entries(overrides)) form.set(key, value);
  return form;
}

describe("provisionAccount authorization", () => {
  it("propagates the admin gate for non-admin callers", async () => {
    asNonAdmin();
    await expect(provisionAccount(provisionForm())).rejects.toThrow("REDIRECT:/app");
  });

  it("rejects invalid input without touching Supabase", async () => {
    asAdmin();
    const { invoke } = mockClient();
    const result = await provisionAccount(provisionForm({ username: "ab", password: "short", role: "admin" }));
    expect(result).toEqual({ error: expect.any(String) });
    expect(invoke).not.toHaveBeenCalled();
  });

  it("forwards the exact Edge Function contract on valid input", async () => {
    asAdmin();
    const { invoke } = mockClient();
    const result = await provisionAccount(provisionForm());
    expect(result).toEqual({ ok: true, userId: "new-id", username: "new.user" });
    expect(invoke).toHaveBeenCalledWith("provision-user", {
      body: {
        username: "new.user",
        displayName: "New User",
        password: "initial-pass-1",
        role: "student",
        phone: null,
        gradeLevel: "Class 9",
        subject: null,
      },
      headers: { Authorization: `Bearer ${FAKE_TOKEN}` },
    });
  });

  it("maps Edge Function failures to safe messages", async () => {
    asAdmin();
    mockClient();
    const { invoke } = mockClient();
    invoke.mockResolvedValueOnce({ data: { ok: false, error: "That username is already in use." }, error: null });
    const result = await provisionAccount(provisionForm());
    expect(result).toEqual({ error: "That username is already in use." });
  });

  it("maps transport failures without leaking internals", async () => {
    asAdmin();
    const { invoke } = mockClient();
    invoke.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const result = await provisionAccount(provisionForm());
    expect(result).toEqual({ error: expect.stringMatching(/unreachable|went wrong/i) });
    expect(String((result as { error: string }).error)).not.toMatch(/Failed to fetch/);
  });

  it("rejects when there is no session to propagate", async () => {
    asAdmin();
    const { invoke, getSession } = mockClient();
    getSession.mockResolvedValueOnce({ data: { session: null } });
    const result = await provisionAccount(provisionForm());
    expect(result).toEqual({ error: expect.stringMatching(/session has expired/i) });
    expect(invoke).not.toHaveBeenCalled();
  });

  it("maps a 401 from the function to session-expired", async () => {
    asAdmin();
    const { invoke } = mockClient();
    invoke.mockResolvedValueOnce({ data: null, error: { message: "Unauthorized", context: { status: 401 } } });
    const result = await provisionAccount(provisionForm());
    expect(result).toEqual({ error: expect.stringMatching(/session has expired/i) });
  });

  it("maps a 403 from the function to not-authorized", async () => {
    asAdmin();
    const { invoke } = mockClient();
    invoke.mockResolvedValueOnce({ data: null, error: { message: "Forbidden", context: { status: 403 } } });
    const result = await provisionAccount(provisionForm());
    expect(result).toEqual({ error: expect.stringMatching(/not authorized/i) });
  });

  it("surfaces the function duplicate-username message", async () => {
    asAdmin();
    const { invoke } = mockClient();
    invoke.mockResolvedValueOnce({
      data: null,
      error: { message: "Conflict", context: { status: 409, error: "That username is already in use." } },
    });
    const result = await provisionAccount(provisionForm());
    expect(result).toEqual({ error: "That username is already in use." });
  });

  it("surfaces the function rollback message", async () => {
    asAdmin();
    const { invoke } = mockClient();
    invoke.mockResolvedValueOnce({
      data: null,
      error: {
        message: "Internal Server Error",
        context: { status: 500, error: "Account creation was rolled back because its profile could not be provisioned." },
      },
    });
    const result = await provisionAccount(provisionForm());
    expect(result).toEqual({
      error: "Account creation was rolled back because its profile could not be provisioned.",
    });
  });

  it("never leaks tokens or URLs in any mapped message", async () => {
    asAdmin();
    const { invoke } = mockClient();
    invoke.mockResolvedValueOnce({
      data: null,
      error: { message: `boom ${FAKE_TOKEN} https://x.supabase.co`, context: { status: 500 } },
    });
    const result = await provisionAccount(provisionForm());
    const text = String((result as { error: string }).error);
    expect(text).not.toContain(FAKE_TOKEN);
    expect(text).not.toMatch(/https?:\/\//);
  });
});

describe("asSafeProvisionMessage", () => {
  it("accepts short curated strings", () => {
    expect(asSafeProvisionMessage("That username is already in use.")).toBe(
      "That username is already in use.",
    );
  });

  it("rejects non-strings, empty, and overlong values", () => {
    expect(asSafeProvisionMessage(null)).toBeNull();
    expect(asSafeProvisionMessage(42)).toBeNull();
    expect(asSafeProvisionMessage("  ")).toBeNull();
    expect(asSafeProvisionMessage("x".repeat(301))).toBeNull();
  });

  it("rejects URLs, tokens, secrets, and passwords", () => {
    expect(asSafeProvisionMessage("see https://x.supabase.co/auth for details")).toBeNull();
    expect(asSafeProvisionMessage("Bearer tok-abc")).toBeNull();
    expect(asSafeProvisionMessage("eyJhbGciOiJIUzI1NiJ9.payload.sig")).toBeNull();
    expect(asSafeProvisionMessage("service_role key required")).toBeNull();
    expect(asSafeProvisionMessage("password: hunter2")).toBeNull();
  });
});

describe("mapProvisionInvokeError", () => {
  it("returns null for empty or shapeless errors", async () => {
    await expect(mapProvisionInvokeError(null)).resolves.toBeNull();
    await expect(mapProvisionInvokeError(new TypeError("Failed to fetch"))).resolves.toBeNull();
  });

  it("maps a 404 to the not-deployed message", async () => {
    await expect(mapProvisionInvokeError({ message: "Not found", context: { status: 404 } })).resolves.toMatch(
      /not deployed/i,
    );
  });
});

describe("status and profile mutations", () => {
  it("rejects non-admin callers at the gate", async () => {
    asNonAdmin();
    const form = new FormData();
    form.set("userId", TEACHER_ID);
    form.set("status", "suspended");
    await expect(setUserStatus(form)).rejects.toThrow("REDIRECT:/app");
  });

  it("rejects invalid status input without touching Supabase", async () => {
    asAdmin();
    const { rpc } = mockClient();
    const form = new FormData();
    form.set("userId", "not-a-uuid");
    form.set("status", "suspended");
    expect(await setUserStatus(form)).toEqual({ error: expect.any(String) });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("calls admin_set_profile_status with exact params", async () => {
    asAdmin();
    const { rpc } = mockClient();
    const form = new FormData();
    form.set("userId", TEACHER_ID);
    form.set("status", "suspended");
    expect(await setUserStatus(form)).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("admin_set_profile_status", {
      p_user_id: TEACHER_ID,
      p_status: "suspended",
    });
  });

  it("maps RPC failures to safe messages", async () => {
    asAdmin();
    const { rpc } = mockClient();
    rpc.mockResolvedValueOnce({ data: null, error: { message: "CANNOT_CHANGE_OWN_STATUS" } });
    const form = new FormData();
    form.set("userId", TEACHER_ID);
    form.set("status", "suspended");
    expect(await setUserStatus(form)).toEqual({ error: expect.stringMatching(/own account/i) });
  });

  it("calls admin_update_profile with exact params", async () => {
    asAdmin();
    const { rpc } = mockClient();
    const form = new FormData();
    form.set("userId", STUDENT_ID);
    form.set("displayName", "Aarav Sharma");
    form.set("phone", "");
    form.set("gradeLevel", "Class 10");
    form.set("subject", "");
    expect(await updateUserProfile(form)).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("admin_update_profile", {
      p_user_id: STUDENT_ID,
      p_display_name: "Aarav Sharma",
      p_phone: null,
      p_grade_level: "Class 10",
      p_subject: null,
    });
  });
});

describe("relationship mutations", () => {
  it("rejects non-admin callers at the gate", async () => {
    asNonAdmin();
    const form = new FormData();
    form.set("teacherId", TEACHER_ID);
    form.set("studentId", STUDENT_ID);
    await expect(assignRelationship(form)).rejects.toThrow("REDIRECT:/app");
  });

  it("rejects non-uuid pairing without touching Supabase", async () => {
    asAdmin();
    const { rpc } = mockClient();
    const form = new FormData();
    form.set("teacherId", "not-a-uuid");
    form.set("studentId", STUDENT_ID);
    const result = await assignRelationship(form);
    expect(result).toEqual({ error: expect.any(String) });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("calls admin_assign_teacher_student with exact params", async () => {
    asAdmin();
    const { rpc } = mockClient();
    const form = new FormData();
    form.set("teacherId", TEACHER_ID);
    form.set("studentId", STUDENT_ID);
    expect(await assignRelationship(form)).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("admin_assign_teacher_student", {
      p_teacher_id: TEACHER_ID,
      p_student_id: STUDENT_ID,
    });
  });

  it("calls admin_unassign_teacher_student with exact params", async () => {
    asAdmin();
    const { rpc } = mockClient();
    const form = new FormData();
    form.set("teacherId", TEACHER_ID);
    form.set("studentId", STUDENT_ID);
    expect(await unassignRelationship(form)).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("admin_unassign_teacher_student", {
      p_teacher_id: TEACHER_ID,
      p_student_id: STUDENT_ID,
    });
  });
});
