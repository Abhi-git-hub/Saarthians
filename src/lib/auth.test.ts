import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser, homeForRole, requireRole } from "./auth";

const ADMIN_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

// Minimal chainable query stub: from().select().eq().single() / .maybeSingle().
function mockProfileQuery(profile: Record<string, unknown> | null) {
  const single = vi.fn().mockResolvedValue(
    profile ? { data: profile, error: null } : { data: null, error: { message: "none" } },
  );
  const eq = vi.fn().mockReturnValue({ single, maybeSingle: single });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from, select, eq, single };
}

function mockAuth(claimsSub: string | null, profile: Record<string, unknown> | null) {
  const q = mockProfileQuery(profile);
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getClaims: vi.fn().mockResolvedValue(
        claimsSub ? { data: { claims: { sub: claimsSub } }, error: null } : { data: null, error: { message: "no session" } },
      ),
    },
    from: q.from,
  } as never);
  return q;
}

const ACTIVE_ADMIN = {
  display_name: "Root",
  username: "root.admin",
  role: "admin",
  status: "active",
};

describe("getAuthenticatedUser", () => {
  it("returns null with no session", async () => {
    mockAuth(null, null);
    await expect(getAuthenticatedUser()).resolves.toBeNull();
  });

  it("returns null for suspended profiles even with a session", async () => {
    mockAuth(ADMIN_ID, { ...ACTIVE_ADMIN, status: "suspended" });
    await expect(getAuthenticatedUser()).resolves.toBeNull();
  });

  it("returns null for unknown roles", async () => {
    mockAuth(ADMIN_ID, { ...ACTIVE_ADMIN, role: "superuser" });
    await expect(getAuthenticatedUser()).resolves.toBeNull();
  });

  it("returns the user for an active admin", async () => {
    mockAuth(ADMIN_ID, ACTIVE_ADMIN);
    await expect(getAuthenticatedUser()).resolves.toMatchObject({ id: ADMIN_ID, role: "admin" });
  });
});

describe("requireRole", () => {
  it("redirects anonymous users to login", async () => {
    mockAuth(null, null);
    await expect(requireRole(["admin"])).rejects.toThrow("REDIRECT:/login?reason=signin_required");
  });

  it("redirects a student away from admin to their home", async () => {
    mockAuth(ADMIN_ID, { ...ACTIVE_ADMIN, role: "student", status: "active" });
    await expect(requireRole(["admin"])).rejects.toThrow("REDIRECT:/app");
  });

  it("redirects a teacher away from admin to their home", async () => {
    mockAuth(ADMIN_ID, { ...ACTIVE_ADMIN, role: "teacher", status: "active" });
    await expect(requireRole(["admin"])).rejects.toThrow("REDIRECT:/teacher");
  });

  it("allows an active admin and returns the user", async () => {
    mockAuth(ADMIN_ID, ACTIVE_ADMIN);
    await expect(requireRole(["admin"])).resolves.toMatchObject({ role: "admin" });
  });

  it("allows multi-role gates", async () => {
    mockAuth(ADMIN_ID, { ...ACTIVE_ADMIN, role: "teacher", status: "active" });
    await expect(requireRole(["teacher", "admin"])).resolves.toMatchObject({ role: "teacher" });
  });
});

describe("homeForRole", () => {
  it("maps each role to its workspace", () => {
    expect(homeForRole("admin")).toBe("/admin");
    expect(homeForRole("teacher")).toBe("/teacher");
    expect(homeForRole("student")).toBe("/app");
  });
});
