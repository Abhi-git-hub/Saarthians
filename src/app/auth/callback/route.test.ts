import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { RECOVERY_COOKIE_NAME } from "@/lib/recovery";
import { GET } from "./route";

const USER_A = "11111111-1111-4111-8111-111111111111";

function mockExchange(result: { userId: string | null; exchangeError?: string }) {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue(
        result.exchangeError || !result.userId
          ? { data: { user: null, session: null }, error: { message: result.exchangeError ?? "bad code" } }
          : { data: { user: { id: result.userId }, session: {} }, error: null },
      ),
    },
  } as never);
}

function get(url: string) {
  return new Request(`http://localhost${url}`);
}

function setCookies(res: Response): string[] {
  // NextResponse may emit one Set-Cookie header per cookie; collect them all.
  const headers = res.headers.getSetCookie?.() ?? [];
  const single = res.headers.get("set-cookie");
  return headers.length > 0 ? headers : single ? [single] : [];
}

describe("GET /auth/callback", () => {
  it("establishes the recovery marker on a successful recovery-code exchange", async () => {
    mockExchange({ userId: USER_A });
    const res = await GET(get("/auth/callback?code=abc&next=/login/reset-password"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login/reset-password");
    const marker = setCookies(res).find((c) => c.startsWith(`${RECOVERY_COOKIE_NAME}=`));
    expect(marker).toBeDefined();
    expect(marker).toContain(`${RECOVERY_COOKIE_NAME}=${USER_A}`);
    expect(marker).toMatch(/httponly/i);
    expect(marker).toMatch(/Max-Age=900/);
    expect(marker).toMatch(/Path=\/login\/reset-password/);
    expect(marker).toMatch(/SameSite=Lax/i);
  });

  it("redirects to the invalid-link state without a marker when exchange fails", async () => {
    mockExchange({ userId: null, exchangeError: "code verifier missing" });
    const res = await GET(get("/auth/callback?code=bad&next=/login/reset-password"));
    expect(res.headers.get("location")).toBe("http://localhost/login/reset-password?error=invalid_link");
    expect(setCookies(res).some((c) => c.startsWith(`${RECOVERY_COOKIE_NAME}=`))).toBe(false);
  });

  it("redirects a codeless recovery hit to the invalid-link state", async () => {
    const res = await GET(get("/auth/callback?next=/login/reset-password"));
    expect(res.headers.get("location")).toBe("http://localhost/login/reset-password?error=invalid_link");
  });

  it("keeps open-redirect protection: absolute and protocol-relative targets fall back to /app", async () => {
    mockExchange({ userId: USER_A });
    const absolute = await GET(get("/auth/callback?code=abc&next=https://evil.example/phish"));
    expect(absolute.headers.get("location")).toBe("http://localhost/app");
    const protocolRelative = await GET(get("/auth/callback?code=abc&next=//evil.example/phish"));
    expect(protocolRelative.headers.get("location")).toBe("http://localhost/app");
  });

  it("does not set a recovery marker for non-recovery destinations", async () => {
    mockExchange({ userId: USER_A });
    const res = await GET(get("/auth/callback?code=abc&next=/app/tests"));
    expect(res.headers.get("location")).toBe("http://localhost/app/tests");
    expect(setCookies(res).some((c) => c.startsWith(`${RECOVERY_COOKIE_NAME}=`))).toBe(false);
  });
});
