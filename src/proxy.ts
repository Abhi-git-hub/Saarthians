import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/app", "/teacher", "/admin"];
const CANONICAL_HOST = "saarthians.online";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, key };
}

export async function proxy(request: NextRequest) {
  // Canonical host/protocol first (SEO): www collapses to the apex and
  // plain HTTP upgrades to HTTPS, both via permanent redirects that preserve
  // path and query. Local development hosts are never redirected.
  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const isLocal =
    host.startsWith("localhost") || host.startsWith("127.") || host.startsWith("192.168.") || host.endsWith(".local");
  if (!isLocal && (host === `www.${CANONICAL_HOST}` || (host === CANONICAL_HOST && request.nextUrl.protocol === "http:"))) {
    const canonical = request.nextUrl.clone();
    canonical.protocol = "https:";
    canonical.host = CANONICAL_HOST;
    return NextResponse.redirect(canonical, 301);
  }

  const isProtected = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname === prefix || request.nextUrl.pathname.startsWith(`${prefix}/`),
  );

  // Public pages need no session work at all: skip Supabase entirely so the
  // canonical redirect above is the only thing ever standing in front of SEO.
  if (!isProtected) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseConfig();

  // Fail closed: without backend config the session cannot be verified, so
  // protected areas redirect to login instead of rendering unverified.
  if (!url || !key) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set({ name, value });
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set({ name, value, ...options });
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  let userId = data?.claims?.sub ?? null;

  // getClaims() only verifies the access token locally and never refreshes.
  // Supabase access tokens live ~1 hour: without a refresh attempt here,
  // every visit after expiry bounced to /login even with a valid refresh
  // token in cookies. So on missing/expired claims, fall through to
  // getUser(), which refreshes the session server-side and persists the new
  // cookies via setAll above. Only when that also fails is the visitor
  // genuinely signed out.
  if (!userId) {
    try {
      const { data: refreshed } = await supabase.auth.getUser();
      userId = refreshed.user?.id ?? null;
    } catch {
      // Auth backend unreachable: behave as signed out rather than 500.
      userId = null;
    }
  }

  if (!userId) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/:path*"],
};
