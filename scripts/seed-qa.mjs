#!/usr/bin/env node
/*
 * scripts/seed-qa.mjs — idempotent QA seed for the two canonical test accounts.
 *
 *   STUDENT  test.student / test.student@accounts.saarthians.online
 *   TEACHER  test.teacher / test.teacher@accounts.saarthians.online
 *
 * Reads everything from the environment, stores nothing, commits nothing:
 *   SUPABASE_URL            (required)  e.g. https://<ref>.supabase.co
 *   SUPABASE_ANON_KEY       (required)  publishable/anon key (admin sign-in + Edge invoke)
 *   SUPABASE_SERVICE_ROLE_KEY (optional) enables discovery, verification, repair;
 *                             without it the script can only attempt provisioning
 *   ADMIN_EMAIL / ADMIN_PASSWORD (required) active admin used to call the
 *                             provision-user Edge Function (the app's own path)
 *
 * Modes (no destructive action is ever the default):
 *   node scripts/seed-qa.mjs                  create missing QA users, report state
 *   node scripts/seed-qa.mjs --repair         additionally delete+recreate QA users
 *                                             whose profile is wrong (never others)
 *   node scripts/seed-qa.mjs --reset-password set fresh generated passwords for
 *                                             the QA users and print them ONCE
 *
 * Safety rails: every destructive path is restricted to the two hardcoded
 * canonical emails. Anything else aborts. Fresh passwords are printed to
 * stdout only — store them in your password manager, never in git.
 */

import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const QA_USERS = [
  {
    username: "test.student",
    email: "test.student@accounts.saarthians.online",
    displayName: "Test Student",
    role: "student",
    gradeLevel: "Class 10",
    subject: null,
  },
  {
    username: "test.teacher",
    email: "test.teacher@accounts.saarthians.online",
    displayName: "Test Teacher",
    role: "teacher",
    gradeLevel: null,
    subject: "Mathematics",
  },
];
const QA_EMAILS = new Set(QA_USERS.map((u) => u.email));

const args = new Set(process.argv.slice(2));
const WANT_REPAIR = args.has("--repair");
const WANT_RESET_PASSWORD = args.has("--reset-password");
if ([...args].some((a) => a !== "--repair" && a !== "--reset-password")) {
  console.error("Usage: node scripts/seed-qa.mjs [--repair] [--reset-password]");
  process.exit(2);
}

function env(name, { required = false } = {}) {
  const value = process.env[name];
  if (required && !value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(2);
  }
  return value;
}

function newPassword() {
  return `Qa-${randomBytes(18).toString("base64url")}`;
}

function profileMatches(profile, spec) {
  return (
    profile &&
    profile.username === spec.username &&
    profile.display_name === spec.displayName &&
    profile.role === spec.role &&
    profile.status === "active"
  );
}

const SUPABASE_URL = env("SUPABASE_URL", { required: true });
const ANON_KEY = env("SUPABASE_ANON_KEY", { required: true });
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = env("ADMIN_EMAIL", { required: true });
const ADMIN_PASSWORD = env("ADMIN_PASSWORD", { required: true });

const anon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const admin = SERVICE_KEY
  ? createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

if (!SERVICE_KEY) {
  console.log("NOTE: SUPABASE_SERVICE_ROLE_KEY not set — running in limited mode (provision attempts only, no discovery/verify/repair).");
}

async function findAuthUser(email) {
  if (!QA_EMAILS.has(email)) throw new Error(`Refusing to look up non-QA email: ${email}`);
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 100) return null;
    page += 1;
  }
}

async function readProfile(userId) {
  const { data, error } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw new Error(`profile read failed: ${error.message}`);
  return data;
}

async function provisionViaEdgeFunction(spec, password) {
  const { data: session, error: signInError } = await anon.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (signInError || !session?.session) {
    throw new Error(`admin sign-in failed: ${signInError?.message ?? "no session"}`);
  }
  const { data, error } = await anon.functions.invoke("provision-user", {
    body: {
      username: spec.username,
      displayName: spec.displayName,
      password,
      role: spec.role,
      phone: null,
      gradeLevel: spec.gradeLevel,
      subject: spec.subject,
    },
    headers: { Authorization: `Bearer ${session.session.access_token}` },
  });
  await anon.auth.signOut().catch(() => {});
  if (error) throw new Error(`provision-user invoke failed: ${error.message}`);
  if (!data?.ok) throw new Error(`provision-user refused: ${data?.error ?? "unknown error"}`);
  return data.user;
}

async function ensureUser(spec) {
  const label = `${spec.role} <${spec.email}>`;
  let authUser = null;
  if (admin) authUser = await findAuthUser(spec.email);

  if (authUser) {
    const profile = admin ? await readProfile(authUser.id) : null;
    if (profileMatches(profile, spec) && !WANT_RESET_PASSWORD) {
      console.log(`OK      ${label} — profile correct, no change.`);
      return { changed: false, authUser };
    }
    if (!WANT_REPAIR && !WANT_RESET_PASSWORD) {
      console.log(`DRIFT   ${label} — profile incorrect or missing; rerun with --repair to delete+recreate (QA-only).`);
      return { changed: false, authUser, drift: true };
    }
    if (WANT_REPAIR && !profileMatches(profile, spec)) {
      console.log(`REPAIR  ${label} — deleting QA auth user (profiles cascade, audit preserved)...`);
      const { error } = await admin.auth.admin.deleteUser(authUser.id);
      if (error) {
        // Most likely cause: test_attempts.student_id ON DELETE RESTRICT —
        // the QA user owns graded work, so refuse rather than destroy data.
        console.log(`KEEP    ${label} — cannot delete (${error.message}); left untouched.`);
        return { changed: false, authUser, drift: true };
      }
      authUser = null;
    }
    if (WANT_RESET_PASSWORD && authUser) {
      const password = newPassword();
      const { error } = await admin.auth.admin.updateUserById(authUser.id, { password });
      if (error) throw new Error(`password reset failed for ${label}: ${error.message}`);
      console.log(`RESET   ${label} — new temporary password (store securely, shown once):`);
      console.log(`        username: ${spec.username}   password: ${password}`);
      return { changed: true, authUser };
    }
  }

  if (!authUser) {
    const password = newPassword();
    console.log(`CREATE  ${label} — provisioning via Edge Function...`);
    const created = await provisionViaEdgeFunction(spec, password);
    console.log(`CREATED ${label} — id ${created.id}. Temporary password (store securely, shown once):`);
    console.log(`        username: ${spec.username}   password: ${password}`);
    if (admin) {
      const profile = await readProfile(created.id);
      if (!profileMatches(profile, spec)) throw new Error(`post-create verification failed for ${label}`);
      console.log(`VERIFY  ${label} — auth ↔ profile ↔ role ↔ status consistent.`);
    }
    return { changed: true, authUser: created };
  }

  return { changed: false, authUser };
}

let failures = 0;
for (const spec of QA_USERS) {
  try {
    await ensureUser(spec);
  } catch (error) {
    failures += 1;
    console.log(`FAIL    ${spec.role} <${spec.email}> — ${error instanceof Error ? error.message : error}`);
  }
}
if (failures > 0) {
  console.log(`${failures} QA account(s) need attention.`);
  process.exit(1);
}
console.log("Done. No other accounts were touched.");
