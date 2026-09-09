import { describe, expect, it, vi } from "vitest";

// The Supabase client must never be touched when validation fails — the mock
// throws loudly if the action reaches past its guards.
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => {
    throw new Error("SUPABASE_MUST_NOT_BE_REACHED");
  },
}));

import { updateRecoveryPassword } from "./actions";

describe("updateRecoveryPassword validation", () => {
  it("rejects short passwords without touching Supabase", async () => {
    const result = await updateRecoveryPassword({ password: "short", confirm: "short" });
    expect(result).toEqual({ error: expect.stringMatching(/10 and 128/) });
  });

  it("rejects mismatched confirmation without touching Supabase", async () => {
    const result = await updateRecoveryPassword({
      password: "a-strong-password-1",
      confirm: "a-different-password-2",
    });
    expect(result).toEqual({ error: expect.stringMatching(/do not match/) });
  });

  it("passes validation for a well-formed input (reaches Supabase)", async () => {
    await expect(
      updateRecoveryPassword({ password: "a-strong-password-1", confirm: "a-strong-password-1" }),
    ).rejects.toThrow("SUPABASE_MUST_NOT_BE_REACHED");
  });
});
