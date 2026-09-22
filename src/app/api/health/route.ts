import { NextResponse } from "next/server";

// Public liveness probe. Deliberately minimal: status + server time only.
// No versions, no dependency states, no secrets, no user data.
export async function GET() {
  return NextResponse.json(
    { status: "ok", time: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
