import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/security";

export type AuthenticatedUser = {
  id: string;
  email?: string;
  displayName: string;
  username?: string;
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
    .select("display_name,username,role,status")
    .eq("id", userId)
    .single();

  if (profileError || !profile || profile.status !== "active" || !roles.includes(profile.role as Role)) return null;

  return {
    id: userId,
    email,
    displayName: profile.display_name || "Saarthians member",
    username: profile.username ?? undefined,
    role: profile.role as Role,
  };
}

export function homeForRole(role: Role) {
  switch (role) {
    case "admin": return "/admin";
    case "teacher": return "/teacher";
    case "student":
    default: return "/app";
  }
}

export async function requireRole(allowed: Role[]): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?reason=signin_required");
  if (!allowed.includes(user.role)) redirect(homeForRole(user.role));
  return user;
}
