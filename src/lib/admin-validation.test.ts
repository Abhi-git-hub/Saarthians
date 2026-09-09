import { describe, expect, it } from "vitest";
import {
  adminErrorMessage,
  listFilterSchema,
  pageToOffset,
  provisionUserSchema,
  relationshipSchema,
  setStatusSchema,
  totalPages,
  updateProfileSchema,
  usernameSchema,
} from "./admin-validation";

describe("usernameSchema", () => {
  it("accepts lowercase dotted usernames and normalizes case", () => {
    expect(usernameSchema.safeParse("ananya.sharma").success).toBe(true);
    expect(usernameSchema.parse("  Aarav_10  ")).toBe("aarav_10");
  });

  it("rejects short, long, or illegal usernames", () => {
    expect(usernameSchema.safeParse("ab").success).toBe(false);
    expect(usernameSchema.safeParse("UPPER CASE").success).toBe(false);
    expect(usernameSchema.safeParse("-leading").success).toBe(false);
  });
});

describe("provisionUserSchema", () => {
  it("accepts a valid student payload", () => {
    const result = provisionUserSchema.safeParse({
      username: "aarav.sharma",
      displayName: "Aarav Sharma",
      password: "initial-pass-1",
      role: "student",
      gradeLevel: "Class 10",
    });
    expect(result.success).toBe(true);
  });

  it("rejects admin role escalation through provisioning", () => {
    const result = provisionUserSchema.safeParse({
      username: "someone.admin",
      displayName: "Someone",
      password: "initial-pass-1",
      role: "admin",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short passwords", () => {
    expect(
      provisionUserSchema.safeParse({
        username: "aarav.sharma",
        displayName: "Aarav",
        password: "short",
        role: "student",
      }).success,
    ).toBe(false);
  });
});

describe("status, relationship, and profile schemas", () => {
  it("only allows known statuses", () => {
    expect(
      setStatusSchema.safeParse({
        userId: "00000000-0000-4000-8000-000000000000",
        status: "archived",
      }).success,
    ).toBe(false);
  });

  it("requires uuids on both sides of a relationship", () => {
    expect(
      relationshipSchema.safeParse({ teacherId: "nope", studentId: "nope" }).success,
    ).toBe(false);
  });

  it("validates profile updates", () => {
    const id = "00000000-0000-4000-8000-000000000000";
    expect(updateProfileSchema.safeParse({ userId: id, displayName: "  " }).success).toBe(false);
    expect(
      updateProfileSchema.safeParse({ userId: id, displayName: "Meera", subject: "Maths" }).success,
    ).toBe(true);
  });
});

describe("pagination helpers", () => {
  it("computes offsets and clamps invalid pages", () => {
    expect(pageToOffset(1, 25)).toEqual({ page: 1, offset: 0 });
    expect(pageToOffset(3, 25)).toEqual({ page: 3, offset: 50 });
    expect(pageToOffset(-2, 25)).toEqual({ page: 1, offset: 0 });
    expect(totalPages(0, 25)).toBe(1);
    expect(totalPages(51, 25)).toBe(3);
  });

  it("parses list filters defensively", () => {
    expect(listFilterSchema.safeParse({ page: "abc" }).success).toBe(true);
    const parsed = listFilterSchema.parse({ page: "2", search: "  aarav  " });
    expect(parsed).toEqual({ page: 2, search: "aarav" });
  });
});

describe("adminErrorMessage", () => {
  it("maps known failures without leaking internals", () => {
    expect(adminErrorMessage(new Error("AUTHORIZATION_REQUIRED"))).toMatch(/not authorized/i);
    expect(adminErrorMessage(new Error("USER_NOT_FOUND"))).toMatch(/not found/i);
    expect(adminErrorMessage(new Error("CANNOT_CHANGE_OWN_STATUS"))).toMatch(/own account/i);
    expect(adminErrorMessage(new Error("USERNAME_TAKEN"))).toMatch(/already in use/i);
  });

  it("never returns raw SQL or stack detail", () => {
    const message = adminErrorMessage(new Error('relation "auth.users" does not exist at character 15'));
    expect(message).toBe("Something went wrong. Please try again.");
  });

  it("flags a missing admin migration", () => {
    expect(adminErrorMessage(new Error("function admin_overview() does not exist"))).toMatch(
      /migration/i,
    );
  });
});
