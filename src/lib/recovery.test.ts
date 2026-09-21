import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import { cookies } from "next/headers";
import {
  RECOVERY_COOKIE_MAX_AGE,
  RECOVERY_COOKIE_NAME,
  RECOVERY_COOKIE_PATH,
  clearRecoveryMarker,
  decideResetMode,
  getRecoveryUserId,
  recoveryCookieAttributes,
} from "./recovery";

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";

function mockCookieStore(initial: Record<string, string> = {}) {
  const jar = new Map(Object.entries(initial));
  const store = {
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string, _options?: unknown) => {
      jar.set(name, value);
    },
    delete: (name: string) => {
      jar.delete(name);
    },
  };
  vi.mocked(cookies).mockResolvedValue(store as never);
  return jar;
}

describe("decideResetMode", () => {
  it("signed-out visitor with no marker sees the email form", () => {
    expect(decideResetMode(null, null, false)).toBe("request");
  });

  it("normally authenticated visitor with no marker sees the email form, NOT the update form", () => {
    expect(decideResetMode(null, USER_A, false)).toBe("request");
  });

  it("marker bound to the live session unlocks the update form", () => {
    expect(decideResetMode(USER_A, USER_A, false)).toBe("update");
  });

  it("marker bound to a different user than the session is invalid", () => {
    expect(decideResetMode(USER_A, USER_B, false)).toBe("invalid");
  });

  it("marker without any session (expired/signed out) is invalid", () => {
    expect(decideResetMode(USER_A, null, false)).toBe("invalid");
  });

  it("an error flag always renders invalid, even with marker and session", () => {
    expect(decideResetMode(USER_A, USER_A, true)).toBe("invalid");
    expect(decideResetMode(null, null, true)).toBe("invalid");
  });
});

describe("getRecoveryUserId", () => {
  it("returns the marker for UUID-shaped values", async () => {
    mockCookieStore({ [RECOVERY_COOKIE_NAME]: USER_A });
    await expect(getRecoveryUserId()).resolves.toBe(USER_A);
  });

  it("rejects non-UUID values and absent cookies", async () => {
    mockCookieStore({ [RECOVERY_COOKIE_NAME]: "1; Path=/; HttpOnly" });
    await expect(getRecoveryUserId()).resolves.toBeNull();
    mockCookieStore({});
    await expect(getRecoveryUserId()).resolves.toBeNull();
  });
});

describe("clearRecoveryMarker", () => {
  it("expires the cookie on the recovery path", async () => {
    const set = vi.fn();
    vi.mocked(cookies).mockResolvedValue({ get: () => undefined, set, delete: vi.fn() } as never);
    await clearRecoveryMarker();
    expect(set).toHaveBeenCalledWith(
      RECOVERY_COOKIE_NAME,
      "",
      expect.objectContaining({ httpOnly: true, path: RECOVERY_COOKIE_PATH, maxAge: 0 }),
    );
  });
});

describe("recoveryCookieAttributes", () => {
  it("is HTTP-only, Lax, path-restricted, and short-lived", () => {
    expect(recoveryCookieAttributes()).toEqual({
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: RECOVERY_COOKIE_PATH,
      maxAge: RECOVERY_COOKIE_MAX_AGE,
    });
    expect(RECOVERY_COOKIE_MAX_AGE).toBeLessThanOrEqual(900);
  });
});
