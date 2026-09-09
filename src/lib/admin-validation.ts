import { z } from "zod";

// Shared server-side validation for the admin control plane. Pure module so it
// can be unit-tested without Supabase. Client forms may mirror these rules for
// UX, but these schemas are always re-applied on the server.
//
// Account provisioning itself runs through the provision-user Edge Function
// (single audited path); the schemas below mirror that contract so failures
// surface friendly messages before the call.

export const adminRoleSchema = z.enum(["student", "teacher", "admin"]);
export const adminStatusSchema = z.enum(["active", "suspended", "pending"]);
export const contentStatusSchema = z.enum(["draft", "published", "archived"]);

// Must match profiles_username_format_check and the provision-user function.
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters.")
  .max(30, "Username must be 30 characters or fewer.")
  .regex(
    /^[a-z0-9](?:[a-z0-9._-]{2,29})$/,
    "Use lowercase letters, numbers, dots, hyphens or underscores.",
  );

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a display name.")
  .max(120, "Display name must be 120 characters or fewer.");

// The provision-user function requires 10–128 characters.
export const provisionPasswordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters.")
  .max(128, "Password must be 128 characters or fewer.");

export const phoneSchema = z
  .string()
  .trim()
  .max(32, "Phone must be 32 characters or fewer.")
  .optional();

export const gradeLevelSchema = z
  .string()
  .trim()
  .max(40, "Class/grade must be 40 characters or fewer.")
  .optional();

export const subjectSchema = z
  .string()
  .trim()
  .max(120, "Subject must be 120 characters or fewer.")
  .optional();

export const uuidSchema = z.string().uuid("Invalid identifier.");

export const provisionUserSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  password: provisionPasswordSchema,
  role: z.enum(["student", "teacher"]),
  phone: phoneSchema,
  gradeLevel: gradeLevelSchema,
  subject: subjectSchema,
});

export const updateProfileSchema = z.object({
  userId: uuidSchema,
  displayName: displayNameSchema,
  phone: phoneSchema,
  gradeLevel: gradeLevelSchema,
  subject: subjectSchema,
});

export const setStatusSchema = z.object({
  userId: uuidSchema,
  status: adminStatusSchema,
});

export const relationshipSchema = z.object({
  teacherId: uuidSchema,
  studentId: uuidSchema,
});

export const listFilterSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(120).optional().catch(undefined),
});

export type ProvisionUserInput = z.infer<typeof provisionUserSchema>;

export const PAGE_SIZE = 25;
export const AUDIT_PAGE_SIZE = 50;

export function pageToOffset(page: number, pageSize: number) {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  return { page: safePage, offset: (safePage - 1) * pageSize };
}

export function totalPages(totalCount: number, pageSize: number) {
  if (!Number.isFinite(totalCount) || totalCount <= 0) return 1;
  return Math.max(1, Math.ceil(totalCount / pageSize));
}

// Map database/RPC/Edge-Function failures to safe, user-friendly messages.
// Never surfaces SQL text, stack traces, or infrastructure detail.
export function adminErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");

  if (/AUTHORIZATION_REQUIRED|NOT_AUTHORIZED|not authorized|permission denied|Administrator access required/i.test(raw)) {
    return "You are not authorized to perform this action.";
  }
  if (/USER_NOT_FOUND|TEACHER_NOT_FOUND|STUDENT_NOT_FOUND|RELATIONSHIP_NOT_FOUND|PROFILE_NOT_FOUND/i.test(raw)) {
    return "The requested record was not found. It may have been removed.";
  }
  if (/CANNOT_CHANGE_OWN_STATUS/i.test(raw)) {
    return "You cannot change your own account status.";
  }
  if (/USERNAME_TAKEN|username.*already|already.*username|already.*registered|already.*exists/i.test(raw)) {
    return "That username is already in use.";
  }
  if (/USERNAME_INVALID|Username must be/i.test(raw)) {
    return "Username must be 3–30 characters using lowercase letters, numbers, dots, hyphens or underscores.";
  }
  if (/INVALID_DISPLAY_NAME|DISPLAY_NAME_REQUIRED|full name is required/i.test(raw)) {
    return "Enter a display name between 1 and 120 characters.";
  }
  if (/INVALID_PHONE/i.test(raw)) {
    return "Enter a valid phone number (at least 7 characters) or leave it blank.";
  }
  if (/INVALID_(ROLE|STATUS|USER|RELATIONSHIP|TITLE|DURATION|PROMPT|POINTS|POSITION)|ROLE_NOT_ALLOWED|USER_ID_REQUIRED/i.test(raw)) {
    return "Some details were invalid. Check the form and try again.";
  }
  if (/Password must be between|weak.*password|password.*weak|password should/i.test(raw)) {
    return "Use a password between 10 and 128 characters.";
  }
  if (/MIGRATION_REQUIRED|function.*does not exist|could not find.*function/i.test(raw)) {
    return "The admin database update has not been applied yet. Ask the system owner to apply the latest migration.";
  }
  if (/Failed to fetch|NetworkError|FunctionsHttpError|Edge Function/i.test(raw)) {
    return "The account service is unreachable right now. Please try again.";
  }
  return "Something went wrong. Please try again.";
}
