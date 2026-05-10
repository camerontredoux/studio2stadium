# Summit Plan 01b — Legacy Cleanup (Deferred from Plan 01 Task 9)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Remove every live read/write of `platform_name`, `user_platforms`, and `prodigy_admin` from the codebase, then drop the legacy table, column, and enum values. Plan 01 stopped at Task 8 because this cleanup turned out to be a multi-callsite refactor, not a single migration.

**Architecture:** Rewrite each callsite to consume `org_memberships` + `school_favorites.source_org_id` instead of the legacy fields. Only after every live usage is gone do we run the destructive migration. Every callsite gets a test.

**Tech Stack:** Adonis 6, Drizzle ORM, VineJS, Japa.

**Source spec sections:** Plan 01 Section 6 (Existing System Changes), final cleanup.

**Depends on:** Plan 01 (committed on `plan/summit-multi-tenant`, commits `ff81405` through `ac9438d`).

**Blocks:** Nothing. Plans 02–07 can proceed without this plan — they only depend on the additive tables from Plan 01.

---

## Why This Was Deferred

Plan 01's original Task 9 was written as a single drop-and-cleanup step. A grep at Task 9 gate revealed ~9 live callsites across auth, signup, school favorites, dancer favoriting, dancer profile reads, and a validator. Each one needs:

1. Understanding of what it currently does with `platformName` / `user_platforms` / `prodigy_admin`
2. A replacement using `org_memberships` and/or `source_org_id`
3. A test proving the replacement is correct
4. Potential API contract changes for anything reachable from the frontend (e.g., the favorite service takes a `platform: "core" | "prodigy"` arg today)

That's a meaningful refactor, not a cleanup. Rolling it into Plan 01 would have put the dev DB in a broken state for an extended window. Shipping Plan 01 at Task 8 keeps the additive half of the migration stable while this plan handles the destructive half as its own body of work.

---

## Live Callsite Inventory (captured during Plan 01 Task 9 gate)

Verified on `plan/summit-multi-tenant` @ `ac9438d`:

| # | File | What it does today | Target behavior |
|---|---|---|---|
| 1 | `apps/backend/app/database/prisma/schema.prisma` | Dead Prisma schema file — contains `platform_name`, `Platform`, `PlatformName`, `prodigy_admin`. No `@prisma/client` import anywhere. Not in `package.json`. | Delete the file (and its parent dir if empty). |
| 2 | `apps/backend/app/utils/auth.ts:6` | `isAdmin()` returns true for `role === "admin" \|\| role === "prodigy_admin"`. | Return true only for `role === "admin"`. |
| 3 | `apps/backend/app/auth/queries.ts:40,78` | Session loader reads `user_platforms.platformName` and attaches `platforms: string[]` to the session payload. | Read `org_memberships.orgId` joined with `organizations.slug`, attach as `orgs: string[]` (or similar). Keep backward compatibility if any frontend consumer reads `session.platforms`. |
| 4 | `apps/backend/app/modules/schools/get-favorites-data/service.ts:15,45` | Selects and returns `platformName` in the favorites payload. | Select `sourceOrgId`, join `organizations`, return the org slug as `sourceOrgSlug` (or rename to match existing contract). |
| 5 | `apps/backend/app/modules/auth/signup/service.ts:51` | Inserts `platformName: "core"` into `user_platforms` on new user creation. | Insert `org_memberships` row with the "core" org id. Find core org id once at service init or use a cached lookup. |
| 6 | `apps/backend/app/modules/dancers/engagement/favorite/service.ts` | Accepts `platform: "core" \| "prodigy"` arg; writes `platformName` on the favorites row. | Accept an org slug arg; resolve to org id via `organizations.slug` lookup; write `sourceOrgId`. Frontend callers must be updated too (see Task 7 below). |
| 7 | `apps/backend/app/modules/dancers/engagement/unfavorite/service.ts` | Reads `favorites.platformName` to scope the delete. | Scope via `sourceOrgId` instead. |
| 8 | `apps/backend/app/modules/dancers/profile/get-dancer/service.ts:51` | Returns `platformName: "core"` hardcoded in the response shape. | Drop the field or return the user's org slugs via `org_memberships`. Probably drop — Plan 01 hardcoded it as "core" which is meaningless. |
| 9 | `apps/backend/app/modules/dancers/profile/create-dancer/validator.ts:7` | Validator uses `vine.enum(platformName.enumValues)` to validate a `platform` field on the request body. | Either remove the field entirely (if the frontend doesn't send it) or replace with a slug-based enum derived from `organizations`. Inspect the frontend caller before deciding. |

---

## File Map

**Backend delete:**
- `apps/backend/app/database/prisma/schema.prisma` (entire `prisma/` directory if it's the only file)

**Backend modify (one task per file, see below):**
- `apps/backend/app/utils/auth.ts`
- `apps/backend/app/auth/queries.ts`
- `apps/backend/app/modules/schools/get-favorites-data/service.ts`
- `apps/backend/app/modules/auth/signup/service.ts`
- `apps/backend/app/modules/dancers/engagement/favorite/service.ts`
- `apps/backend/app/modules/dancers/engagement/unfavorite/service.ts`
- `apps/backend/app/modules/dancers/profile/get-dancer/service.ts`
- `apps/backend/app/modules/dancers/profile/create-dancer/validator.ts`
- `apps/backend/app/database/schema/users.ts` — remove the `platforms` (user_platforms) export
- `apps/backend/app/database/schema/profiles.ts` — remove the `platformName` column from the favorites table
- `apps/backend/app/database/schema/enums.ts` — remove `platformName` enum and `prodigy_admin` role value

**Frontend modify (possibly):**
- Any consumer of the `favorite` endpoint that sends `platform: "core" | "prodigy"` in the body — needs to switch to slug or stop sending the field.
- Any consumer of the `create-dancer` endpoint that sends a `platform` field.
- Any consumer of `session.platforms` if the shape changes.

Frontend changes are identified per task; this plan treats them as blockers — Task 9 (destructive migration) cannot run while the frontend is still sending legacy fields.

---

## Task 0: Investigation pass (no code changes)

Before editing anything, verify the inventory. Some files may have drifted since `ac9438d`.

- [ ] **Step 1: Re-run the grep**

```bash
cd /home/cameron/Developer/studio2stadium/app/.worktrees/summit-plans
grep -rn "platformName\|platform_name\|user_platforms\|prodigy_admin" apps/backend/app apps/backend/start apps/backend/config 2>/dev/null | grep -v -E "\.spec\.ts|database/schema|database/drizzle|commands/backfill"
```

Expected: the 9 files above. Flag any additional files that show up; add them to the inventory before proceeding.

- [ ] **Step 2: Confirm Prisma is dead**

```bash
grep -rn "@prisma\|from [\"']@prisma" apps/backend/app apps/backend/start 2>/dev/null
grep -E '"prisma|@prisma' apps/backend/package.json
```

Expected: both empty. If either produces output, Prisma is live and this plan needs expansion — stop and escalate.

- [ ] **Step 3: Audit frontend consumers of the favorite and create-dancer endpoints**

```bash
grep -rn "favorite\|unfavorite" apps/frontend/src/features --include="*.ts" --include="*.tsx" | grep -i "platform"
grep -rn "session\\.platforms" apps/frontend/src --include="*.ts" --include="*.tsx"
```

Make a list of frontend files that will need updating alongside the backend. These are tracked as blocker tasks for Task 9.

- [ ] **Step 4: Commit a findings note** (optional — helps reviewer pick up where you left off)

```bash
# If you found new callsites or frontend consumers, add them to this file:
#   docs/superpowers/plans/2026-04-07-summit-01b-findings.md
# Otherwise skip.
```

---

## Task 1: Delete dead Prisma schema

**Files:**
- Delete: `apps/backend/app/database/prisma/schema.prisma`
- Delete: `apps/backend/app/database/prisma/` (if empty after file removal)

- [ ] **Step 1: Confirm nothing imports from the prisma directory**

Run: `grep -rn "database/prisma" apps/backend/app apps/backend/start apps/backend/config 2>/dev/null`
Expected: empty.

- [ ] **Step 2: Delete**

```bash
rm apps/backend/app/database/prisma/schema.prisma
rmdir apps/backend/app/database/prisma 2>/dev/null || true
```

- [ ] **Step 3: Typecheck + test**

```bash
pnpm --filter backend typecheck
node ace test
```
Expected: no regressions, 21/21 tests still pass.

- [ ] **Step 4: Commit**

```bash
git add -A apps/backend/app/database
git commit -m "chore(db): remove dead Prisma schema file"
```

---

## Task 2: Strip `prodigy_admin` from `isAdmin()`

**Files:**
- Modify: `apps/backend/app/utils/auth.ts`
- Test: `apps/backend/app/utils/auth.spec.ts`

- [ ] **Step 1: Write failing test**

```typescript
// apps/backend/app/utils/auth.spec.ts
import { test } from "@japa/runner";
import { isAdmin } from "./auth.ts";

test.group("isAdmin", () => {
  test("true for admin role", ({ assert }) => {
    assert.isTrue(isAdmin({ role: "admin" } as any));
  });
  test("false for user role", ({ assert }) => {
    assert.isFalse(isAdmin({ role: "user" } as any));
  });
  test("false for null/undefined user", ({ assert }) => {
    assert.isFalse(isAdmin(null as any));
    assert.isFalse(isAdmin(undefined as any));
  });
});
```

- [ ] **Step 2: Run to verify passing tests + one potentially-missing case**

Run: `cd apps/backend && node ace test --files "app/utils/auth.spec.ts"`
Expected: all pass (since the current code already handles admin/user/null correctly). The goal of this step is to LOCK IN current behavior before the refactor so we notice if anything changes.

- [ ] **Step 3: Remove the `|| user?.role === "prodigy_admin"` clause**

```typescript
// apps/backend/app/utils/auth.ts — modify the isAdmin function
export function isAdmin(user: { role?: string } | null | undefined) {
  return user?.role === "admin";
}
```

- [ ] **Step 4: Re-run the test**

Run: `node ace test --files "app/utils/auth.spec.ts"`
Expected: still 3/3 pass. The external behavior is unchanged for admin/user/null inputs. The only externally-visible change is that a future `prodigy_admin` role — which cannot exist after Task 10 anyway — would return false.

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm --filter backend typecheck
git add apps/backend/app/utils/auth.ts apps/backend/app/utils/auth.spec.ts
git commit -m "refactor(auth): drop prodigy_admin check from isAdmin"
```

---

## Task 3: Session loader emits org slugs instead of platforms

**Files:**
- Modify: `apps/backend/app/auth/queries.ts`
- Test: `apps/backend/app/auth/queries.spec.ts`

- [ ] **Step 1: Read the current queries.ts to understand the session shape**

```bash
cat apps/backend/app/auth/queries.ts
```

Identify what `platforms` is currently used for on the frontend before changing the shape. Grep for `session.platforms` and `session?.platforms` on the frontend.

- [ ] **Step 2: Write failing test**

The test should create a user with an `org_memberships` row and assert that the session payload contains `{ orgs: ["core"] }` (or the chosen shape).

```typescript
// apps/backend/app/auth/queries.spec.ts — skeleton
import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { seedOrganizations } from "#commands/backfill-organizations";
import { eq } from "drizzle-orm";
// import the session query function — determine the exact export from queries.ts

test.group("session loader orgs", (group) => {
  group.each.setup(async () => {
    await db.delete(orgMemberships).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
    await seedOrganizations();
  });

  test("attaches org slugs from org_memberships", async ({ assert }) => {
    // 1. Create a user
    // 2. Attach org_memberships row to the core org
    // 3. Call the session loader for that user id
    // 4. Assert payload.orgs includes "core"
  });

  test("returns empty orgs array when user has no memberships", async ({ assert }) => {
    // ...
  });
});
```

- [ ] **Step 3: Implement**

Replace the `user_platforms` JOIN in queries.ts with an `org_memberships` + `organizations` JOIN. Emit slugs in whatever field name is chosen (`orgs`, or keep `platforms` for compat but populate from orgs).

- [ ] **Step 4: Run tests, fix frontend consumers if the shape changed**

If you renamed `platforms` → `orgs`, update any frontend reference that you identified in Task 0 Step 3. If you kept the field name, frontend is unchanged.

- [ ] **Step 5: Full test suite**

```bash
node ace test
```
Expected: all previously-passing tests still pass, plus the new ones.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(auth): session loader reads org_memberships instead of user_platforms"
```

---

## Task 4: Signup writes `org_memberships` instead of `user_platforms`

**Files:**
- Modify: `apps/backend/app/modules/auth/signup/service.ts`
- Test: add cases to `apps/backend/app/modules/auth/signup/service.spec.ts` (create if absent)

- [ ] **Step 1: Read the current signup service**

Identify where the `user_platforms` insert happens and what the surrounding transaction looks like.

- [ ] **Step 2: Write failing test covering the new behavior**

```typescript
// excerpt
test("signup creates an org_memberships row for the core org", async ({ assert }) => {
  // Sign up a new user via the signup service
  // Query org_memberships for the user
  // Assert one row exists with orgId = core org's id and type matching user type
});
```

- [ ] **Step 3: Swap the insert**

Resolve the core org id once at service init or via a helper. Inside the transaction, `INSERT INTO org_memberships (user_id, org_id, type, role) VALUES (...)` where type = "dancer" | "coach" based on signup type. Keep the existing `user_platforms` insert IN PLACE for now — this task adds the new insert alongside so live traffic keeps working during the rollout window. The old insert is removed in Task 10.

- [ ] **Step 4: Run test, commit**

```bash
node ace test --files "app/modules/auth/signup/**"
git add -A
git commit -m "refactor(signup): also insert org_memberships alongside user_platforms"
```

---

## Task 5: School favorites data reads `sourceOrgId`

**Files:**
- Modify: `apps/backend/app/modules/schools/get-favorites-data/service.ts`
- Test: `apps/backend/app/modules/schools/get-favorites-data/service.spec.ts`

- [ ] **Step 1: Read the service to identify the `platformName` SELECT**

- [ ] **Step 2: Write failing test asserting the new shape**

The response should expose `sourceOrgSlug` (or `org`) derived from a JOIN on `organizations.slug`. Cover two cases: favorite with `source_org_id` set, favorite with only legacy `platformName` (during the overlap window).

- [ ] **Step 3: Implement**

Replace the SELECT with a JOIN on `organizations` via `source_org_id`. Fall back to `platformName` only if `source_org_id IS NULL` — but since Plan 01 backfilled all existing rows, the fallback should be unreachable in practice. Log if it's ever hit.

- [ ] **Step 4: Run tests, commit**

---

## Task 6: Dancer favorite + unfavorite accept slug

**Files:**
- Modify: `apps/backend/app/modules/dancers/engagement/favorite/service.ts`
- Modify: `apps/backend/app/modules/dancers/engagement/favorite/validator.ts` (if exists)
- Modify: `apps/backend/app/modules/dancers/engagement/unfavorite/service.ts`
- Test: co-located `.spec.ts` for each service
- Modify: frontend callers identified in Task 0

This is the task with the largest API-contract surface. The current services take `platform: "core" | "prodigy"`.

- [ ] **Step 1: Frontend audit**

List every frontend file that calls these endpoints. If any send `platform` in the body, they must be updated.

- [ ] **Step 2: Decide contract**

Two options:
- **(a)** Rename `platform` → `sourceOrgSlug` in the request body. Frontend must update. Cleanest but breaking.
- **(b)** Accept the legacy `platform` field and map `core`/`prodigy` → org slug internally. Zero frontend changes. Leaves debt.

Recommend **(a)** since this is a cleanup plan. Document the choice in the commit.

- [ ] **Step 3: Write failing tests**

Assert the service writes `sourceOrgId` (not `platformName`). Assert unfavorite filters on `sourceOrgId`. Assert validation rejects unknown slugs.

- [ ] **Step 4: Implement**

Resolve `sourceOrgSlug` → org id via a `WHERE slug = :slug` lookup. Write `sourceOrgId` on favorites rows. Leave `platformName` in the insert as `"core"` or `"prodigy"` derived from the slug, ONLY for the duration of this plan (until Task 10 drops the column).

- [ ] **Step 5: Update frontend callers**

- [ ] **Step 6: Full suite + commit**

---

## Task 7: Dancer profile reads no longer hardcode `platformName`

**Files:**
- Modify: `apps/backend/app/modules/dancers/profile/get-dancer/service.ts`

The current code returns `platformName: "core"` in its response. Likely dead client-side but verify.

- [ ] **Step 1: Frontend grep for `dancer.platformName` or `profile.platformName`**

- [ ] **Step 2: If unused on the frontend, remove the field from the response. If used, replace with org slug from `org_memberships`.**

- [ ] **Step 3: Test + commit**

---

## Task 8: Remove `platform` from the create-dancer validator

**Files:**
- Modify: `apps/backend/app/modules/dancers/profile/create-dancer/validator.ts`

- [ ] **Step 1: Frontend audit — does the create-dancer call send a `platform` field?**

- [ ] **Step 2: If no — remove the field from the validator.**

- [ ] **Step 3: If yes — the frontend caller must be updated first (becomes a blocker commit). Then remove the validator field.**

- [ ] **Step 4: Test + commit**

---

## Task 9: Ensure no live callsite remains

**Re-run the grep from Task 0 Step 1.** Any output — other than the schema/enum files that will be dropped in Task 10 — means a callsite was missed. STOP and fix before proceeding.

- [ ] **Step 1: Run the grep**
- [ ] **Step 2: Run the full test suite one more time. Confirm 21+ passing with no regressions.**
- [ ] **Step 3: Typecheck + lint must be clean.**

---

## Task 10: Drop `user_platforms`, `platform_name`, `prodigy_admin`

**DESTRUCTIVE. Only after Task 9 confirms clean.**

**Files:**
- Modify: `apps/backend/app/database/schema/users.ts` — delete the `platforms` pgTable export
- Modify: `apps/backend/app/database/schema/profiles.ts` — delete the `platformName` column from the favorites table
- Modify: `apps/backend/app/database/schema/enums.ts` — delete the `platformName` export and remove `"prodigy_admin"` from the `role` enum values

- [ ] **Step 1: Edit the schema files**

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter backend typecheck`
Expected: no errors. If there are errors, STOP and go back to Task 9 — the grep missed something.

- [ ] **Step 3: Generate migration**

Run: `pnpm --filter backend db:generate`
Expected: new SQL file that drops the table, column, and recreates the `role` enum without `prodigy_admin`. Review the SQL carefully.

- [ ] **Step 4: Confirm no users currently hold the `prodigy_admin` role in dev DB**

```bash
psql "$DATABASE_URL" -c "SELECT id, username, role FROM users WHERE role = 'prodigy_admin';"
```
Expected: zero rows. (Plan 01 confirmed this earlier; re-verify in case something drifted.)

- [ ] **Step 5: Apply migration**

Run: `pnpm --filter backend db:migrate`
Expected: success. If it fails on the enum recreate, investigate — likely a cache or live connection issue.

- [ ] **Step 6: Run the full backend test suite**

Run: `node ace test`
Expected: 21/21 or more pass.

- [ ] **Step 7: Commit**

```bash
git add -A apps/backend/app/database
git commit -m "refactor(db): drop user_platforms, platform_name, prodigy_admin"
```

---

## Task 11: Final verification

- [ ] Full DB reset round-trip on the s2s_test database
- [ ] Full test suite green
- [ ] Typecheck + lint clean
- [ ] Manual smoke: signup a new dancer, favorite a school, unfavorite it, load their profile, load their session. None of these should reference `platformName` anywhere in the stack.

---

## Definition of Done

- Zero live references to `platformName`, `user_platforms`, `prodigy_admin` in backend TS code (schema files will reference them until Task 10 removes the schema definitions).
- Frontend code updated to consume the new shapes where applicable.
- Destructive migration applied successfully.
- Backend test suite + typecheck + lint clean.
- Dev Supabase DB has no `user_platforms` table, no `platform_name` enum, no `prodigy_admin` role value.
