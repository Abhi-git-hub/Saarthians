import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { AUDIT_PAGE_SIZE, PAGE_SIZE, pageToOffset } from "@/lib/admin-validation";
import type { Role } from "@/lib/security";

export type AdminProfile = {
  id: string;
  display_name: string;
  username: string | null;
  role: Role;
  status: "active" | "suspended" | "pending";
  phone: string | null;
  grade_level: string | null;
  subject: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminOverview = {
  students_total: number;
  students_active: number;
  students_pending: number;
  students_suspended: number;
  teachers_total: number;
  teachers_active: number;
  tests_total: number;
  tests_draft: number;
  tests_published: number;
  attempts_total: number;
  attempts_graded: number;
  attempts_last_7d: number;
  users_last_7d: number;
  generated_at: string;
};

export type AdminRelationship = {
  teacher_id: string;
  teacher_name: string;
  student_id: string;
  student_name: string;
  student_status: string;
  status: string;
  created_at: string;
};

export type AdminTestRow = {
  id: string;
  title: string;
  status: string;
  teacher_id: string;
  teacher_name: string;
  question_count: number;
  attempt_count: number;
  created_at: string;
  published_at: string | null;
};

export type AdminAuditRow = {
  id: string;
  created_at: string;
  actor_user_id: string | null;
  actor_name: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata_json: unknown;
};

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message || `${name} failed`);
  return data as T;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  await requireRole(["admin"]);
  return rpc<AdminOverview>("admin_overview", {});
}

export async function listAdminProfiles(options: {
  role?: string | null;
  status?: string | null;
  search?: string | null;
  page?: number;
  limit?: number;
}): Promise<{ rows: (AdminProfile & { total_count: number })[]; total: number; page: number }> {
  await requireRole(["admin"]);
  const pageSize = Math.min(Math.max(options.limit ?? PAGE_SIZE, 1), 100);
  const { page, offset } = pageToOffset(options.page ?? 1, pageSize);
  const rows = await rpc<(AdminProfile & { total_count: number })[]>("admin_list_profiles", {
    p_role: options.role || null,
    p_status: options.status || null,
    p_search: options.search || null,
    p_limit: pageSize,
    p_offset: offset,
  });
  return { rows: rows ?? [], total: Number(rows?.[0]?.total_count ?? 0), page };
}

export async function getAdminProfile(userId: string): Promise<AdminProfile | null> {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,display_name,username,role,status,phone,grade_level,subject,created_at,updated_at")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data as AdminProfile;
}

export async function listAdminRelationships(options: {
  search?: string | null;
  page?: number;
}): Promise<{ rows: (AdminRelationship & { total_count: number })[]; total: number; page: number }> {
  await requireRole(["admin"]);
  const { page, offset } = pageToOffset(options.page ?? 1, PAGE_SIZE);
  const rows = await rpc<(AdminRelationship & { total_count: number })[]>("admin_list_relationships", {
    p_search: options.search || null,
    p_limit: PAGE_SIZE,
    p_offset: offset,
  });
  return { rows: rows ?? [], total: Number(rows?.[0]?.total_count ?? 0), page };
}

export async function listAdminTests(options: {
  status?: string | null;
  search?: string | null;
  page?: number;
}): Promise<{ rows: (AdminTestRow & { total_count: number })[]; total: number; page: number }> {
  await requireRole(["admin"]);
  const { page, offset } = pageToOffset(options.page ?? 1, PAGE_SIZE);
  const rows = await rpc<(AdminTestRow & { total_count: number })[]>("admin_list_tests", {
    p_status: options.status || null,
    p_search: options.search || null,
    p_limit: PAGE_SIZE,
    p_offset: offset,
  });
  return { rows: rows ?? [], total: Number(rows?.[0]?.total_count ?? 0), page };
}

export async function listAdminAudit(options: {
  action?: string | null;
  search?: string | null;
  page?: number;
}): Promise<{ rows: (AdminAuditRow & { total_count: number })[]; total: number; page: number }> {
  await requireRole(["admin"]);
  const { page, offset } = pageToOffset(options.page ?? 1, AUDIT_PAGE_SIZE);
  const rows = await rpc<(AdminAuditRow & { total_count: number })[]>("admin_list_audit", {
    p_action: options.action || null,
    p_search: options.search || null,
    p_limit: AUDIT_PAGE_SIZE,
    p_offset: offset,
  });
  return { rows: rows ?? [], total: Number(rows?.[0]?.total_count ?? 0), page };
}

export async function getAdminDbTime(): Promise<string | null> {
  await requireRole(["admin"]);
  try {
    return await rpc<string>("admin_db_check", {});
  } catch {
    return null;
  }
}

// Recent profiles for dashboard cards. Direct select is admin-gated twice:
// requireRole(["admin"]) here plus the is_admin() RLS policies in Postgres.
export async function getRecentProfiles(limit = 5): Promise<AdminProfile[]> {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,display_name,username,role,status,phone,grade_level,subject,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 10));
  if (error) throw new Error(error.message || "RECENT_USERS_FAILED");
  return (data ?? []) as AdminProfile[];
}
