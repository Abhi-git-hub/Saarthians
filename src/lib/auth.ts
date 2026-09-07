import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/security";

export type AuthenticatedUser = {
  id: string;
  email?: string;
  role: Role;
};

const roles: Role[] = ["student", "teacher", "admin"];

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) return null;

  const userId = String(data.claims.sub);
  const email = typeof data.claims.email === "string" ? data.claims.email : undefined;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", userId)
    .single();

  if (profileError || !profile || profile.status !== "active") return null;
  if (!roles.includes(profile.role as Role)) return null;

  return { id: userId, email, role: profile.role as Role };
}

export async function requireRole(allowed: Role[]): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user || !allowed.includes(user.role)) {
    throw new Error("AUTHORIZATION_REQUIRED");
  }
  return user;
}
