import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { RECOVERY_COOKIE_NAME } from "@/lib/recovery";
import { mapUpdatePasswordError } from "./recovery-errors";
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

function mockSupabase(
  sessionUserId: string | null,
  updateError: string | { message?: string; status?: number; code?: string } | null = null,
) {
  const signOut = vi.fn().mockResolvedValue({});
  const updateUser = vi.fn().mockResolvedValue(
    updateError
      ? { error: typeof updateError === "string" ? { message: updateError } : updateError }
      : { error: null },
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

  it("maps a weak-password failure to the strength message without signing out", async () => {
    mockCookieJar({ [RECOVERY_COOKIE_NAME]: USER_A });
    const { signOut } = mockSupabase(USER_A, "Password should be at least 12 characters");
    const result = await updateRecoveryPassword(GOOD);
    expect(result).toEqual({ error: expect.stringMatching(/stronger password/) });
    expect(signOut).not.toHaveBeenCalled();
  });

  it("maps a reauthentication failure to the restart message without signing out", async () => {
    mockCookieJar({ [RECOVERY_COOKIE_NAME]: USER_A });
    const { signOut } = mockSupabase(USER_A, "Reauthentication required");
    const result = await updateRecoveryPassword(GOOD);
    expect(result).toEqual({ error: expect.stringMatching(/needs to be restarted/) });
    expect(signOut).not.toHaveBeenCalled();
  });

  it("maps an expired-session failure to the invalid-link message", async () => {
    mockCookieJar({ [RECOVERY_COOKIE_NAME]: USER_A });
    mockSupabase(USER_A, "invalid JWT: unable to parse or verify signature");
    const result = await updateRecoveryPassword(GOOD);
    expect(result).toEqual({ error: expect.stringMatching(/invalid or has expired/) });
  });

  it("maps an unknown failure to the generic message", async () => {
    mockCookieJar({ [RECOVERY_COOKIE_NAME]: USER_A });
    mockSupabase(USER_A, "database connection lost");
    const result = await updateRecoveryPassword(GOOD);
    expect(result).toEqual({ error: expect.stringMatching(/fresh link/) });
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

describe("mapUpdatePasswordError", () => {
  it("maps policy messages and bare 422 to the strength message", () => {
    expect(mapUpdatePasswordError({ message: "Password should be at least 12 characters" })).toMatch(
      /stronger password/,
    );
    expect(mapUpdatePasswordError({ code: "weak_password", message: "Signup requires a stronger password" })).toMatch(
      /stronger password/,
    );
    expect(mapUpdatePasswordError({ message: "Database error", status: 422 })).toMatch(/stronger password/);
  });

  it("maps same-password messages to the different-password message", () => {
    expect(mapUpdatePasswordError({ message: "New password should be different from the old password" })).toMatch(
      /different password/,
    );
  });

  it("maps reauthentication demands to the restart message", () => {
    expect(mapUpdatePasswordError({ message: "Reauthentication required", status: 403 })).toMatch(
      /needs to be restarted/,
    );
    expect(mapUpdatePasswordError({ message: "AAL2 required", code: "insufficient_aal" })).toMatch(
      /needs to be restarted/,
    );
  });

  it("maps session failures and bare 401/403/404 to the invalid-link message", () => {
    expect(mapUpdatePasswordError({ message: "invalid JWT: unable to parse", status: 401 })).toMatch(
      /invalid or has expired/,
    );
    expect(mapUpdatePasswordError({ message: "Forbidden", status: 403 })).toMatch(/invalid or has expired/);
    expect(mapUpdatePasswordError({ message: "User not found", status: 404 })).toMatch(/invalid or has expired/);
  });

  it("maps unknown failures and empty input to the generic message", () => {
    expect(mapUpdatePasswordError({ message: "database connection lost", status: 500 })).toMatch(/fresh link/);
    expect(mapUpdatePasswordError(null)).toMatch(/fresh link/);
    expect(mapUpdatePasswordError({})).toMatch(/fresh link/);
  });

  it("never leaks internal detail into any message", () => {
    const messages = [
      mapUpdatePasswordError({ message: "column \"encrypted_password\" violates not-null", status: 500 }),
      mapUpdatePasswordError({ message: "JWT eyJhbGciOiJIUzI1NiJ9.payload.sig expired", status: 401 }),
      mapUpdatePasswordError({ message: "AuthApiError at https://xyz.supabase.co/auth/v1/user", status: 500 }),
    ];
    for (const text of messages) {
      expect(text).not.toMatch(/encrypted_password|eyJ|supabase\.co|https?:\/\//);
    }
  });
});
