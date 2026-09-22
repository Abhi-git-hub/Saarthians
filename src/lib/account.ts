"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";

const passwordSchema = z.object({
  newPassword: z.string().min(10).max(128),
  confirmPassword: z.string().min(10).max(128),
});

// Self-service password change for any signed-in, active user. The update is
// session-bound (Supabase updates the password of the authenticated user
// only), so there is no user-id parameter to tamper with and no role logic.
export async function changeOwnPassword(input: unknown): Promise<{ ok: true } | { error: string }> {
  const user = await getAuthenticatedUser();
  if (!user) return { error: "Your session has expired. Please sign in again." };

  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return { error: "Use a password between 10 and 128 characters." };
  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return { error: "The two passwords do not match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) {
    if (/weak|short|length|characters/i.test(error.message)) {
      return { error: "Choose a stronger password that meets the account password requirements." };
    }
    return { error: "We couldn't update your password. Please try again." };
  }

  return { ok: true };
}
