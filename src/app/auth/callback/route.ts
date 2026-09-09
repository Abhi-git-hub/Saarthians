import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | null) {
  if (value?.startsWith("/") && !value.startsWith("//")) return value;
  return "/app";
}

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
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(failureTarget, requestUrl.origin));
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
