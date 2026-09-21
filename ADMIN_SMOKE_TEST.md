# Saarthians Admin Smoke Test

Run in order against production (`https://saarthians.online`) after every
deployment that touches auth, admin, or Supabase. Each step lists the action,
the expected result, and the failure symptom that means STOP and investigate.

## 0. Deployment-state preconditions (Supabase Dashboard → SQL Editor)

These must pass before any browser step is meaningful. The admin panel cannot
work without them — every admin page calls these RPCs.

```sql
-- 1. All application RPCs exist (expect every name below, no gaps)
select p.proname
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'admin_overview', 'admin_list_profiles', 'admin_set_profile_status',
    'admin_update_profile', 'admin_assign_teacher_student',
    'admin_unassign_teacher_student', 'admin_list_relationships',
    'admin_list_tests', 'admin_list_audit', 'admin_db_check',
    'admin_provision_profile', 'upsert_test_question', 'delete_test_question',
    'start_test_attempt', 'save_test_answer', 'submit_test_attempt',
    'create_teacher_test', 'publish_teacher_test', 'is_admin'
  )
order by 1;
-- FAILURE SYMPTOM: any missing name → run the corresponding migration file
-- from supabase/migrations/ (see docs/SUPABASE_SETUP.md), then re-run this.

-- 2. RLS is on for every app table (expect 11 rows, all true)
select tablename, rowsecurity
from pg_tables where schemaname = 'public'
order by 1;
-- FAILURE SYMPTOM: any rowsecurity = false → investigate before proceeding.

-- 3. Provisioning trigger + identity columns exist
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
  and column_name in ('username', 'phone', 'grade_level', 'subject');
-- Expect 4 rows. Fewer → apply 20260909133000_strengthen_role_provisioning_profiles.sql.
```

Also confirm: Dashboard → Edge Functions → **`provision-user` is deployed**
(missing function = provisioning fails; redeploy from `supabase/functions/`).

## 1. Admin login

- Action: open `/login`, sign in with the admin email + password.
- Expected: lands on `/admin`, nav shows Overview/Users/Relationships/Tests/Audit/Security/System.
- Failure: redirect loop or "not active" → check `profiles` row for
  `role = 'admin'` and `status = 'active'`, and confirm the auth email.

## 2. Dashboard (`/admin`)

- Action: open `/admin`.
- Expected: metric cards show real counts; recent users + recent activity lists render (or honest empty states).
- Failure: error banner about the database update → precondition §0 failed.

## 3. Users (`/admin/users`)

- Action: open, type a name in Search → Apply; change Role/Status filters → Apply; flip pages.
- Expected: list filters live; pagination preserves the query string; empty search shows "No users match."
- Failure: stale results after Apply → report as caching bug.

## 4. Create student

- Action: **+ Add Student** → fill name, username (e.g. `qa.student.<today>`), password ≥10 chars → Create account.
- Expected: success message with `@username`; user appears in the list as active student.
- Failure: error text names the cause (duplicate username, weak password, unreachable service). A generic failure right after a deploy means the Edge Function is missing → §0.

## 5. Create teacher

- Same as §4 via **+ Add Teacher** with a subject. Then open the new teacher's detail page and confirm profile fields render.

## 6. Relationships (`/admin/relationships`)

- Action: assign the QA student to the QA teacher via the dropdowns → Assign.
- Expected: row appears ("learns from"); re-assigning is idempotent, not duplicated.
- Action: Remove → confirm.
- Expected: row disappears; repeat removal reports "not found", never a crash.
- Failure: any error naming roles → confirms server-side pairing validation works.

## 7. Tests (`/admin/tests`)

- Action: open, filter by status, search by title.
- Expected: teacher-owned tests listed with question/attempt counts; read-only (no edit controls on this page by design).

## 8. Audit (`/admin/audit`)

- Action: open after doing §4–§6.
- Expected: entries for provisioning, status/profile edits, and relationship changes, newest first, with actor names and timestamps.
- Failure: actions succeeded but no rows → audit-write regression (check RPC bodies).

## 9. Security (`/admin/security`)

- Action: open.
- Expected: suspended/pending queues and recent admin actions reflect real data (compare against `/admin/users?status=...`).
- Failure: counts disagree → data-source bug.

## 10. System (`/admin/system`)

- Action: open.
- Expected: Database shows "reachable · server time …"; platform totals match `/admin`. No secret values anywhere on the page.

## 11. Sign out

- Action: Sign out from the nav, then visit `/admin/users` directly.
- Expected: bounced to `/login` (proxy + layout both enforce it). Sign back in as admin afterwards.

## Cleanup

Delete only the `qa.*` accounts created above (Dashboard → Authentication → Users → delete; profiles cascade, audit rows are preserved with actor set to null). Never delete real accounts.
