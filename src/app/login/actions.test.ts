import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { RECOVERY_COOKIE_NAME } from "@/lib/recovery";
import { updateRecoveryPassword } from "./actions";

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const GOOD = { password: "a-strong-password-1", confirm: "a-strong-password-1" };

// In-memory cookie jar so clear-then-retry flows behave like the real store.
function mockCookieJar(initial: Record<string, string> = {}) {
  const jar = new Map(Object.entries(initial));
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string, options?: { maxAge?: number }) => {
      if (options?.maxAge === 0) jar.delete(name);
      else jar.set(name, value);
    },
    delete: (name: string) => {
      jar.delete(name);
    },
  } as never);
  return jar;
}

function mockSupabase(sessionUserId: string | null, updateError: string | null = null) {
  const signOut = vi.fn().mockResolvedValue({});
  const updateUser = vi.fn().mockResolvedValue(
    updateError ? { error: { message: updateError } } : { error: null },
  );
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: sessionUserId ? { user: { id: sessionUserId } } : { user: null },
      }),
      updateUser,
      signOut,
    },
  } as never);
  return { signOut, updateUser };
}

describe("updateRecoveryPassword validation", () => {
  it("rejects short passwords without touching Supabase", async () => {
    mockCookieJar();
    mockSupabase(USER_A);
    const result = await updateRecoveryPassword({ password: "short", confirm: "short" });
    expect(result).toEqual({ error: expect.stringMatching(/10 and 128/) });
    expect(vi.mocked(createClient)).not.toHaveBeenCalled();
  });

  it("rejects mismatched confirmation without touching Supabase", async () => {
    mockCookieJar();
    mockSupabase(USER_A);
    const result = await updateRecoveryPassword({
      password: "a-strong-password-1",
      confirm: "a-different-password-2",
    });
    expect(result).toEqual({ error: expect.stringMatching(/do not match/) });
    expect(vi.mocked(createClient)).not.toHaveBeenCalled();
  });
});

describe("updateRecoveryPassword recovery gate", () => {
  it("allows the update when marker and session belong to the same user", async () => {
    mockCookieJar({ [RECOVERY_COOKIE_NAME]: USER_A });
    const { signOut, updateUser } = mockSupabase(USER_A);
    const result = await updateRecoveryPassword(GOOD);
    expect(result).toEqual({ ok: true });
    expect(updateUser).toHaveBeenCalledWith({ password: GOOD.password });
    expect(signOut).toHaveBeenCalled();
  });

  it("rejects an authenticated user with no recovery marker", async () => {
    const jar = mockCookieJar({});
    const { updateUser } = mockSupabase(USER_A);
    const result = await updateRecoveryPassword(GOOD);
    expect(result).toEqual({ error: expect.stringMatching(/invalid or has expired/) });
    expect(updateUser).not.toHaveBeenCalled();
    expect(jar.size).toBe(0);
  });

  it("rejects a marker with no live session and clears the stale marker", async () => {
    const jar = mockCookieJar({ [RECOVERY_COOKIE_NAME]: USER_A });
    const { updateUser } = mockSupabase(null);
    const result = await updateRecoveryPassword(GOOD);
    expect(result).toEqual({ error: expect.stringMatching(/invalid or has expired/) });
    expect(updateUser).not.toHaveBeenCalled();
    expect(jar.has(RECOVERY_COOKIE_NAME)).toBe(false);
  });

  it("rejects a marker bound to a different signed-in user and clears it", async () => {
    const jar = mockCookieJar({ [RECOVERY_COOKIE_NAME]: USER_A });
    const { updateUser } = mockSupabase(USER_B);
    const result = await updateRecoveryPassword(GOOD);
    expect(result).toEqual({ error: expect.stringMatching(/invalid or has expired/) });
    expect(updateUser).not.toHaveBeenCalled();
    expect(jar.has(RECOVERY_COOKIE_NAME)).toBe(false);
  });

  it("surfaces update failures without signing out", async () => {
    mockCookieJar({ [RECOVERY_COOKIE_NAME]: USER_A });
    const { signOut } = mockSupabase(USER_A, "weak password");
    const result = await updateRecoveryPassword(GOOD);
    expect(result).toEqual({ error: expect.stringMatching(/fresh link/) });
    expect(signOut).not.toHaveBeenCalled();
  });

  it("a second update after success is rejected (marker consumed)", async () => {
    const jar = mockCookieJar({ [RECOVERY_COOKIE_NAME]: USER_A });
    mockSupabase(USER_A);
    expect(await updateRecoveryPassword(GOOD)).toEqual({ ok: true });
    expect(jar.has(RECOVERY_COOKIE_NAME)).toBe(false);
    expect(await updateRecoveryPassword(GOOD)).toEqual({
      error: expect.stringMatching(/invalid or has expired/),
    });
  });
});
