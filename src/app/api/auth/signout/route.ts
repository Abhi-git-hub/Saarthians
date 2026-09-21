import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clearRecoveryMarker } from "@/lib/recovery";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // A sign-out ends every flow, including password recovery: drop the marker
  // so it can never linger past the session it belonged to.
  try {
    await clearRecoveryMarker();
  } catch {
    // Non-fatal: the marker self-expires within minutes.
  }
  const url = new URL("/login", request.url);
  return NextResponse.redirect(url, 303);
}
