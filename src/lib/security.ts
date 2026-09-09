import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
});

export const loginIdentifierSchema = z.string().trim().min(3).max(254);

export type Role = "student" | "teacher" | "admin";

export function canAccessRole(role: Role, allowed: readonly Role[]) {
  return allowed.includes(role);
}

export function genericAuthError() {
  return "Unable to sign in with those credentials.";
}
