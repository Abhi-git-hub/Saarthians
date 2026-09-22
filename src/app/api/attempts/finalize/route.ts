import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Beacon-compatible finalization for page-leave and sign-out. The client
// fires this when the student leaves mid-attempt; the DATABASE still decides
// (submit_test_attempt records auto_deadline when past the deadline, or the
// given leave reason otherwise). Never throws: leave-paths must not trap.
const bodySchema = z.object({
  attemptId: z.string().uuid(),
  reason: z.enum(["auto_leave", "signout_finalize"]).default("auto_leave"),
});

export async function POST(request: Request) {
  try {
    await requireRole(["student"]);
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const supabase = await createClient();
    if (parsed.data.reason === "signout_finalize") {
      await supabase.rpc("log_test_security_event", {
        p_attempt_id: parsed.data.attemptId,
        p_event_type: "signout_finalize",
        p_metadata: {},
      });
    }
    await supabase.rpc("submit_test_attempt", {
      p_attempt_id: parsed.data.attemptId,
      p_reason: "auto_leave",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
