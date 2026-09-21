import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RECOVERY_COOKIE_NAME, recoveryCookieAttributes } from "@/lib/recovery";

function safeNext(value: string | null) {
  if (value?.startsWith("/") && !value.startsWith("//")) return value;
  return "/app";
}

// Single canonical place that exchanges emailed PKCE codes. For recovery
// links (next === /login/reset-password) a successful exchange additionally
// sets the short-lived, HTTP-only recovery marker bound to the recovered
// user — the only server-verifiable proof of recovery intent.
const RECOVERY_PATH = "/login/reset-password";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNext(requestUrl.searchParams.get("next"));
  // Recovery links land back on the reset page, which renders its own
  // invalid/expired state — anything else falls back to the login error.
  const failureTarget = next.startsWith("/login/reset-password")
    ? "/login/reset-password?error=invalid_link"
    : "/login?error=auth_callback";

  if (!code) {
    return NextResponse.redirect(new URL(failureTarget, requestUrl.origin));
  }

  const supabase = await createClient();
  const { data: exchanged, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !exchanged.user) {
    return NextResponse.redirect(new URL(failureTarget, requestUrl.origin));
  }

  if (next === RECOVERY_PATH) {
    const response = NextResponse.redirect(new URL(next, requestUrl.origin));
    response.cookies.set(RECOVERY_COOKIE_NAME, exchanged.user.id, recoveryCookieAttributes());
    return response;
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
