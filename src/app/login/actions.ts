"use server";

import { createClient } from "@/lib/supabase/server";
import { loginIdentifierSchema } from "@/lib/security";

const managedAccountDomain = "accounts.saarthians.online";

export async function signInWithIdentifier(input: { identifier: string; password: string; next?: string | null }) {
  const parsedIdentifier = loginIdentifierSchema.safeParse(input.identifier);
  if (!parsedIdentifier.success || typeof input.password !== "string" || input.password.length < 8 || input.password.length > 128) {
    return { error: "Enter your username (or administrator email) and password." };
  }

  const identifier = parsedIdentifier.data.toLowerCase();
  const email = identifier.includes("@") ? identifier : `${identifier}@${managedAccountDomain}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: input.password });

  if (error) return { error: "We couldn't sign you in. Check your credentials and try again." };

  const { data: authUser } = await supabase.auth.getUser();
  const { data: profile } = authUser.user
    ? await supabase.from("profiles").select("status,role").eq("id", authUser.user.id).maybeSingle()
    : { data: null };

  if (!profile || profile.status !== "active" || !["student", "teacher", "admin"].includes(profile.role)) {
    await supabase.auth.signOut();
    return { error: "This account is not active. Contact the administrator." };
  }

  const next = input.next;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  const redirectTo = safeNext ?? (profile.role === "admin" ? "/admin" : profile.role === "teacher" ? "/teacher" : "/app");
  return { ok: true, redirectTo };
}
