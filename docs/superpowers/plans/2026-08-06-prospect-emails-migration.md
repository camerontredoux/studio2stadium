# Prospect Emails Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the two coach-facing prospect emails off AWS Lambda + EventBridge Scheduler into the AdonisJS app's in-process cron, fixing the dead endpoint, the never-scheduled September send, and the broken early/new submission split.

**Architecture:** Two jobs registered in `start/cron.ts`, each wrapped in a Postgres session-level advisory lock so only one of the two Fly machines executes a given tick. Each job's logic lives in a service under `apps/backend/services/`, invoked by both cron and a new ace command that supports `--dry-run`. Email bodies are React Email templates in `packages/emails`, sent through the existing `@adonisjs/mail` SES transport.

**Tech Stack:** AdonisJS 6, Drizzle ORM (`drizzle-orm/postgres-js`), postgres.js 3.4, `cron` v4, Luxon, React Email (`@stos/emails`), Japa, `@adonisjs/mail` v10.

## Global Constraints

- Target statuses are `'pending'` and `'in_review'` from the `prospect_status` enum (`["pending","released","in_review","accepted"]`). Old `NONE` maps to new `pending`.
- All schedules use timezone `America/Denver`, passed explicitly — the existing `new CronJob(expr, fn).start()` calls in `start/cron.ts` pass no timezone and would otherwise run in the machine's UTC.
- Reminder cron expression is `0 0 1 10,11,12,2,3,4,5,6,7,8 *` — unchanged from the current EventBridge schedule. It skips January and September by design.
- Digest sends are Sept 1 at 09:00 and Jan 2 at 09:00, both `America/Denver`.
- Digest cutoff is the **most recent August 1 at or before the run date**, in `America/Denver`.
- The digest template MUST NOT be named `ProspectStatusEmail`. That name is taken by a live dancer-facing email at `packages/emails/src/templates/ProspectStatusEmail.tsx`, sent from `app/modules/schools/update-submission/event.ts:50`.
- `CRON_EMAILS_ENABLED` defaults to **off**. Both jobs must refuse to send when it is not `true`.
- Both emails set `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
- The unsubscribe token MUST NOT be a bare `users.id`. The old system used one, letting anyone unsubscribe anyone by guessing a UUID.
- Reminder subject: `Quick Reminder: Update Your Prospect Statuses`
- Digest subject: `Your Studio 2 Stadium Recruiting Submissions`
- Never use `rg -r` when searching — it is `--replace`, not "recursive", and silently rewrites match output.

## File Structure

**Create:**

| Path | Responsibility |
|---|---|
| `apps/backend/app/shared/cron/advisory-lock.ts` | `withAdvisoryLock` — single-machine execution guard |
| `apps/backend/app/shared/cron/advisory-lock.spec.ts` | Lock tests |
| `apps/backend/app/shared/prospect-emails/cutoff.ts` | `mostRecentAugustFirst` — Denver-aware cutoff |
| `apps/backend/app/shared/prospect-emails/cutoff.spec.ts` | Cutoff tests (pure logic) |
| `apps/backend/app/shared/prospect-emails/recipients.ts` | `findProspectEmailRecipients` — shared targeting query |
| `apps/backend/app/shared/prospect-emails/recipients.spec.ts` | Targeting tests |
| `apps/backend/app/shared/prospect-emails/unsubscribe-token.ts` | Sign/verify unsubscribe tokens |
| `apps/backend/app/shared/prospect-emails/unsubscribe-token.spec.ts` | Token tests |
| `apps/backend/app/shared/prospect-emails/reminder-email.ts` | `ProspectReminderMail` BaseMail class |
| `apps/backend/app/shared/prospect-emails/digest-email.ts` | `ProspectDigestMail` BaseMail class |
| `apps/backend/app/modules/users/unsubscribe/controller.ts` | GET/POST unsubscribe handler |
| `apps/backend/app/modules/users/unsubscribe/service.ts` | Flips `users.notifications` |
| `apps/backend/app/modules/users/unsubscribe/service.spec.ts` | Unsubscribe tests |
| `apps/backend/services/send-prospect-reminders.ts` | Job A |
| `apps/backend/services/send-prospect-reminders.spec.ts` | Job A tests |
| `apps/backend/services/send-prospect-digest.ts` | Job B |
| `apps/backend/services/send-prospect-digest.spec.ts` | Job B tests |
| `apps/backend/commands/send-prospect-emails.ts` | Ace command with `--dry-run` |
| `packages/emails/src/templates/ProspectReminderEmail.tsx` | Static reminder body |
| `packages/emails/src/templates/ProspectSubmissionsDigestEmail.tsx` | Digest body with two buckets |

**Modify:**

| Path | Change |
|---|---|
| `apps/backend/app/database/connection.ts` | Export the raw `client` so the lock can reserve a connection |
| `apps/backend/start/env.ts` | Add `CRON_EMAILS_ENABLED` |
| `apps/backend/adonisrc.ts` | Add `services/**/*.spec.ts` to the functional suite |
| `apps/backend/start/cron.ts` | Register both jobs |
| `apps/backend/app/modules/users/routes.ts` | Register the unsubscribe route |
| `packages/emails/src/index.ts` | Export both new templates |

**Why a reserved connection for the lock:** a session-level advisory lock belongs to one connection. `db.execute()` goes through a pool and may unlock on a different connection than it locked, silently leaking the lock. `pg_advisory_xact_lock` inside a transaction would solve that but holds a transaction open for the entire send, doing external SES I/O inside it. `client.reserve()` (postgres.js 3.4, confirmed present) pins one connection without a transaction.

---

### Task 1: Advisory lock helper and env kill switch

**Files:**
- Modify: `apps/backend/app/database/connection.ts`
- Modify: `apps/backend/start/env.ts`
- Create: `apps/backend/app/shared/cron/advisory-lock.ts`
- Test: `apps/backend/app/shared/cron/advisory-lock.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `client` — the raw postgres.js client, exported from `#database/connection`
  - `withAdvisoryLock<T>(key: number, fn: () => Promise<T>): Promise<T | null>` — returns `null` when the lock was already held
  - `PROSPECT_REMINDER_LOCK_KEY = 4820001`, `PROSPECT_DIGEST_LOCK_KEY = 4820002`
  - `env.get("CRON_EMAILS_ENABLED")` — `boolean | undefined`

- [ ] **Step 1: Write the failing test**

Create `apps/backend/app/shared/cron/advisory-lock.spec.ts`:

```ts
import { test } from "@japa/runner";
import {
  withAdvisoryLock,
  PROSPECT_REMINDER_LOCK_KEY,
} from "./advisory-lock.ts";

test.group("withAdvisoryLock", () => {
  test("runs the callback and returns its value", async ({ assert }) => {
    const result = await withAdvisoryLock(PROSPECT_REMINDER_LOCK_KEY, async () => "ran");
    assert.equal(result, "ran");
  });

  test("returns null and skips the callback when the lock is held", async ({
    assert,
  }) => {
    let innerRan = false;

    const outer = await withAdvisoryLock(PROSPECT_REMINDER_LOCK_KEY, async () => {
      const inner = await withAdvisoryLock(PROSPECT_REMINDER_LOCK_KEY, async () => {
        innerRan = true;
        return "inner";
      });
      return inner;
    });

    assert.isNull(outer);
    assert.isFalse(innerRan);
  });

  test("releases the lock when the callback throws", async ({ assert }) => {
    await assert.rejects(() =>
      withAdvisoryLock(PROSPECT_REMINDER_LOCK_KEY, async () => {
        throw new Error("boom");
      })
    );

    const after = await withAdvisoryLock(PROSPECT_REMINDER_LOCK_KEY, async () => "reacquired");
    assert.equal(after, "reacquired");
  });
});
```

Note on the second test: the nested call reserves a *different* connection from the pool, so it genuinely contends for the lock. `pg_try_advisory_lock` is non-blocking, so the inner call returns `false` immediately rather than deadlocking. The outer call therefore returns whatever the inner returned — `null`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && pnpm test --files="app/shared/cron/advisory-lock.spec.ts"`
Expected: FAIL — cannot resolve `./advisory-lock.ts`

- [ ] **Step 3: Export the raw client**

Modify `apps/backend/app/database/connection.ts` — change the `client` line to export it:

```ts
export const client = postgres(env.get("DATABASE_URL"), { prepare: false });
```

Leave the rest of the file unchanged; `drizzle({ client, relations, casing: "snake_case" })` still refers to the same binding.

- [ ] **Step 4: Write the lock helper**

Create `apps/backend/app/shared/cron/advisory-lock.ts`:

```ts
import { client } from "#database/connection";

/**
 * Distinct keys per job. Postgres advisory locks share one global namespace,
 * so these must not collide with any other advisory lock in the app.
 */
export const PROSPECT_REMINDER_LOCK_KEY = 4820001;
export const PROSPECT_DIGEST_LOCK_KEY = 4820002;

/**
 * Run `fn` only if this process can take the advisory lock for `key`.
 *
 * The app runs multiple Fly machines and `#start/cron` is preloaded on each of
 * them, so without this every scheduled job fires once per machine. The first
 * machine to acquire the lock runs the job; the others return null immediately.
 *
 * Uses a reserved connection rather than the pool: a session-level advisory
 * lock belongs to the connection that took it, and unlocking on a different
 * pooled connection would leak the lock permanently.
 */
export async function withAdvisoryLock<T>(
  key: number,
  fn: () => Promise<T>
): Promise<T | null> {
  const reserved = await client.reserve();

  try {
    const [row] = await reserved<{ locked: boolean }[]>`
      select pg_try_advisory_lock(${key}) as locked
    `;

    if (!row?.locked) {
      return null;
    }

    try {
      return await fn();
    } finally {
      await reserved`select pg_advisory_unlock(${key})`;
    }
  } finally {
    reserved.release();
  }
}
```

- [ ] **Step 5: Add the env kill switch**

Modify `apps/backend/start/env.ts` — add below the `HEALTH_SECRET` line:

```ts
  /*
  |----------------------------------------------------------
  | Scheduled email jobs (default off; must be explicitly
  | enabled in production after a verified dry run)
  |----------------------------------------------------------
  */
  CRON_EMAILS_ENABLED: Env.schema.boolean.optional(),
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd apps/backend && pnpm test --files="app/shared/cron/advisory-lock.spec.ts"`
Expected: PASS, 3 tests

- [ ] **Step 7: Typecheck**

Run: `cd apps/backend && pnpm typecheck`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add apps/backend/app/shared/cron apps/backend/app/database/connection.ts apps/backend/start/env.ts
git commit -m "feat(backend): add advisory lock helper and cron email kill switch"
```

---

### Task 2: August 1 cutoff helper

**Files:**
- Create: `apps/backend/app/shared/prospect-emails/cutoff.ts`
- Test: `apps/backend/app/shared/prospect-emails/cutoff.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `PROSPECT_TZ = "America/Denver"`
  - `mostRecentAugustFirst(now: Date): Date`

- [ ] **Step 1: Write the failing test**

Create `apps/backend/app/shared/prospect-emails/cutoff.spec.ts`:

```ts
import { test } from "@japa/runner";
import { DateTime } from "luxon";
import { mostRecentAugustFirst, PROSPECT_TZ } from "./cutoff.ts";

function denver(iso: string): Date {
  return DateTime.fromISO(iso, { zone: PROSPECT_TZ }).toJSDate();
}

test.group("mostRecentAugustFirst", () => {
  test("September 1 2026 run resolves to August 1 2026", async ({ assert }) => {
    const cutoff = mostRecentAugustFirst(denver("2026-09-01T09:00:00"));
    assert.equal(
      DateTime.fromJSDate(cutoff, { zone: PROSPECT_TZ }).toISODate(),
      "2026-08-01"
    );
  });

  test("January 2 2027 run resolves back to August 1 2026", async ({ assert }) => {
    const cutoff = mostRecentAugustFirst(denver("2027-01-02T09:00:00"));
    assert.equal(
      DateTime.fromJSDate(cutoff, { zone: PROSPECT_TZ }).toISODate(),
      "2026-08-01"
    );
  });

  test("both sends in one cycle share the same cutoff", async ({ assert }) => {
    const sept = mostRecentAugustFirst(denver("2026-09-01T09:00:00"));
    const jan = mostRecentAugustFirst(denver("2027-01-02T09:00:00"));
    assert.equal(sept.getTime(), jan.getTime());
  });

  test("exactly August 1 midnight counts as the current cycle", async ({ assert }) => {
    const cutoff = mostRecentAugustFirst(denver("2026-08-01T00:00:00"));
    assert.equal(
      DateTime.fromJSDate(cutoff, { zone: PROSPECT_TZ }).toISODate(),
      "2026-08-01"
    );
  });

  test("July 31 falls back to the previous August", async ({ assert }) => {
    const cutoff = mostRecentAugustFirst(denver("2026-07-31T23:59:00"));
    assert.equal(
      DateTime.fromJSDate(cutoff, { zone: PROSPECT_TZ }).toISODate(),
      "2025-08-01"
    );
  });

  test("cutoff is midnight Denver, not midnight UTC", async ({ assert }) => {
    const cutoff = mostRecentAugustFirst(denver("2026-09-01T09:00:00"));
    const local = DateTime.fromJSDate(cutoff, { zone: PROSPECT_TZ });
    assert.equal(local.hour, 0);
    assert.equal(local.minute, 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && pnpm test --files="app/shared/prospect-emails/cutoff.spec.ts"`
Expected: FAIL — cannot resolve `./cutoff.ts`

- [ ] **Step 3: Write the implementation**

Create `apps/backend/app/shared/prospect-emails/cutoff.ts`:

```ts
import { DateTime } from "luxon";

export const PROSPECT_TZ = "America/Denver";

/**
 * The recruiting cycle boundary: the most recent August 1 at or before `now`.
 *
 * Submissions created before this instant are "early"; on or after it are
 * "new". Both the September and the January send of a given cycle resolve to
 * the same August 1, so a coach sees a consistent split across both emails.
 *
 * The old implementation hardcoded 2026-01-02 as the boundary while the job
 * fired at 2026-01-02T00:00 Denver (07:00Z), so "new" could only ever contain
 * a 7-hour sliver and in practice rendered empty.
 */
export function mostRecentAugustFirst(now: Date): Date {
  const local = DateTime.fromJSDate(now, { zone: PROSPECT_TZ });

  const augustThisYear = DateTime.fromObject(
    { year: local.year, month: 8, day: 1 },
    { zone: PROSPECT_TZ }
  ).startOf("day");

  const cutoff =
    local < augustThisYear ? augustThisYear.minus({ years: 1 }) : augustThisYear;

  return cutoff.toJSDate();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/backend && pnpm test --files="app/shared/prospect-emails/cutoff.spec.ts"`
Expected: PASS, 6 tests

- [ ] **Step 5: Commit**

```bash
git add apps/backend/app/shared/prospect-emails/cutoff.ts apps/backend/app/shared/prospect-emails/cutoff.spec.ts
git commit -m "feat(backend): add August 1 recruiting cycle cutoff helper"
```

---

### Task 3: Shared recipient query

**Files:**
- Create: `apps/backend/app/shared/prospect-emails/recipients.ts`
- Test: `apps/backend/app/shared/prospect-emails/recipients.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface ProspectEmailRecipient { schoolId: string; schoolName: string; userId: string; email: string }`
  - `findProspectEmailRecipients(): Promise<ProspectEmailRecipient[]>`

- [ ] **Step 1: Write the failing test**

Create `apps/backend/app/shared/prospect-emails/recipients.spec.ts`. Read `app/modules/orgs/events/rosters/list/service.spec.ts` first for the fixture style — insert rows directly with drizzle, clean up in `group.each.setup`.

```ts
import { test } from "@japa/runner";
import { db } from "#database/connection";
import { crvSubmissions } from "#database/schema/crv";
import { dancerProfiles } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { findProspectEmailRecipients } from "./recipients.ts";

let seq = 0;
function unique(prefix: string) {
  seq += 1;
  return `${prefix}-${Date.now()}-${seq}`;
}

async function makeSchool(opts: { notifications?: boolean } = {}) {
  const handle = unique("school");
  const [user] = await db
    .insert(users)
    .values({
      username: handle,
      email: `${handle}@example.com`,
      role: "user",
      type: "school",
      displayEmail: `${handle}@example.com`,
      firstName: "Test",
      lastName: "School",
      password: "x",
      notifications: opts.notifications ?? true,
    })
    .returning();

  const [school] = await db
    .insert(schoolProfiles)
    .values({ userId: user!.id, name: unique("School Name"), location: "CO" })
    .returning();

  return { user: user!, school: school! };
}

async function makeDancer() {
  const handle = unique("dancer");
  const [user] = await db
    .insert(users)
    .values({
      username: handle,
      email: `${handle}@example.com`,
      role: "user",
      type: "dancer",
      displayEmail: `${handle}@example.com`,
      firstName: "Test",
      lastName: "Dancer",
      password: "x",
    })
    .returning();

  const [dancer] = await db
    .insert(dancerProfiles)
    .values({ userId: user!.id, birthday: "2006-01-01", location: "CO" })
    .returning();

  return dancer!;
}

test.group("findProspectEmailRecipients", (group) => {
  group.each.setup(async () => {
    await db.delete(crvSubmissions).execute();
    await db.delete(dancerProfiles).execute();
    await db.delete(schoolProfiles).execute();
    await db.delete(users).execute();
  });

  test("includes a school with a pending submission", async ({ assert }) => {
    const { school, user } = await makeSchool();
    const dancer = await makeDancer();
    await db
      .insert(crvSubmissions)
      .values({ dancerId: dancer.id, schoolId: school.id, status: "pending" });

    const recipients = await findProspectEmailRecipients();

    assert.lengthOf(recipients, 1);
    assert.equal(recipients[0]!.schoolId, school.id);
    assert.equal(recipients[0]!.email, user.email);
    assert.equal(recipients[0]!.schoolName, school.name);
  });

  test("includes a school with an in_review submission", async ({ assert }) => {
    const { school } = await makeSchool();
    const dancer = await makeDancer();
    await db
      .insert(crvSubmissions)
      .values({ dancerId: dancer.id, schoolId: school.id, status: "in_review" });

    const recipients = await findProspectEmailRecipients();
    assert.lengthOf(recipients, 1);
  });

  test("excludes schools whose submissions are all resolved", async ({ assert }) => {
    const { school } = await makeSchool();
    const accepted = await makeDancer();
    const released = await makeDancer();
    await db.insert(crvSubmissions).values([
      { dancerId: accepted.id, schoolId: school.id, status: "accepted" },
      { dancerId: released.id, schoolId: school.id, status: "released" },
    ]);

    const recipients = await findProspectEmailRecipients();
    assert.isEmpty(recipients);
  });

  test("excludes schools whose user opted out of notifications", async ({ assert }) => {
    const { school } = await makeSchool({ notifications: false });
    const dancer = await makeDancer();
    await db
      .insert(crvSubmissions)
      .values({ dancerId: dancer.id, schoolId: school.id, status: "pending" });

    const recipients = await findProspectEmailRecipients();
    assert.isEmpty(recipients);
  });

  test("returns one row per school regardless of submission count", async ({ assert }) => {
    const { school } = await makeSchool();
    const first = await makeDancer();
    const second = await makeDancer();
    await db.insert(crvSubmissions).values([
      { dancerId: first.id, schoolId: school.id, status: "pending" },
      { dancerId: second.id, schoolId: school.id, status: "in_review" },
    ]);

    const recipients = await findProspectEmailRecipients();
    assert.lengthOf(recipients, 1);
  });
});
```

Fixture columns are the verified `notNull` set: `users` requires `username`, `email`, `role`, `type`, `displayEmail`, `firstName`, `lastName`, `password`; `dancerProfiles` requires `userId`, `birthday` (a `date({ mode: "string" })`, so pass `"2006-01-01"`, not a `Date`), and `location`; `schoolProfiles` requires `userId`, `name` (unique), and `location`. Valid enum values: `role` is one of `admin | prodigy_admin | user`, `type` is `dancer | school`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && pnpm test --files="app/shared/prospect-emails/recipients.spec.ts"`
Expected: FAIL — cannot resolve `./recipients.ts`

- [ ] **Step 3: Write the implementation**

Create `apps/backend/app/shared/prospect-emails/recipients.ts`:

```ts
import { db } from "#database/connection";
import { crvSubmissions } from "#database/schema/crv";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { and, eq, inArray } from "drizzle-orm";

export interface ProspectEmailRecipient {
  schoolId: string;
  schoolName: string;
  userId: string;
  email: string;
}

/**
 * Schools with at least one unresolved CRV submission, whose owning user still
 * accepts notifications.
 *
 * Shared by both the monthly reminder and the twice-yearly digest so the two
 * emails can never disagree about who is an active recruiter. The old stack
 * kept status on a separate `prospectStatus` table; it now lives on the
 * submission row, and old `NONE` is new `pending`.
 */
export async function findProspectEmailRecipients(): Promise<
  ProspectEmailRecipient[]
> {
  return await db
    .selectDistinct({
      schoolId: schoolProfiles.id,
      schoolName: schoolProfiles.name,
      userId: users.id,
      email: users.email,
    })
    .from(crvSubmissions)
    .innerJoin(schoolProfiles, eq(crvSubmissions.schoolId, schoolProfiles.id))
    .innerJoin(users, eq(schoolProfiles.userId, users.id))
    .where(
      and(
        inArray(crvSubmissions.status, ["pending", "in_review"]),
        eq(users.notifications, true)
      )
    );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/backend && pnpm test --files="app/shared/prospect-emails/recipients.spec.ts"`
Expected: PASS, 5 tests

- [ ] **Step 5: Commit**

```bash
git add apps/backend/app/shared/prospect-emails/recipients.ts apps/backend/app/shared/prospect-emails/recipients.spec.ts
git commit -m "feat(backend): add shared prospect email recipient query"
```

---

### Task 4: Unsubscribe token and route

**Files:**
- Create: `apps/backend/app/shared/prospect-emails/unsubscribe-token.ts`
- Test: `apps/backend/app/shared/prospect-emails/unsubscribe-token.spec.ts`
- Create: `apps/backend/app/modules/users/unsubscribe/service.ts`
- Create: `apps/backend/app/modules/users/unsubscribe/controller.ts`
- Test: `apps/backend/app/modules/users/unsubscribe/service.spec.ts`
- Modify: `apps/backend/app/modules/users/routes.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `signUnsubscribeToken(userId: string): string`
  - `verifyUnsubscribeToken(token: string): string | null` — returns the userId, or `null` if forged/expired
  - `unsubscribeUrl(siteUrl: string, userId: string): string`
  - `UnsubscribeService.execute(token: string): Promise<boolean>`

The token is an encrypted, signed payload produced by AdonisJS's `encryption` service (keyed on `APP_KEY`), with a purpose string so it cannot be replayed against another feature, and a 1-year expiry to outlive a recruiting cycle.

- [ ] **Step 1: Write the failing token test**

Create `apps/backend/app/shared/prospect-emails/unsubscribe-token.spec.ts`:

```ts
import { test } from "@japa/runner";
import encryption from "@adonisjs/core/services/encryption";
import {
  signUnsubscribeToken,
  unsubscribeUrl,
  verifyUnsubscribeToken,
} from "./unsubscribe-token.ts";

test.group("unsubscribe tokens", () => {
  test("round-trips a user id", async ({ assert }) => {
    const token = signUnsubscribeToken("user-123");
    assert.equal(verifyUnsubscribeToken(token), "user-123");
  });

  test("does not expose the raw user id", async ({ assert }) => {
    const token = signUnsubscribeToken("user-123");
    assert.notInclude(token, "user-123");
  });

  test("rejects a forged token", async ({ assert }) => {
    assert.isNull(verifyUnsubscribeToken("not-a-real-token"));
  });

  test("rejects a token encrypted for a different purpose", async ({ assert }) => {
    const wrongPurpose = encryption.encrypt("user-123", undefined, "some-other-purpose");
    assert.isNull(verifyUnsubscribeToken(wrongPurpose));
  });

  test("builds a url with the token in the query string", async ({ assert }) => {
    const url = unsubscribeUrl("https://example.com/", "user-123");
    assert.match(url, /^https:\/\/example\.com\/unsubscribe\?token=/);
    assert.notInclude(url, "user-123");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && pnpm test --files="app/shared/prospect-emails/unsubscribe-token.spec.ts"`
Expected: FAIL — cannot resolve `./unsubscribe-token.ts`

- [ ] **Step 3: Write the token helper**

Create `apps/backend/app/shared/prospect-emails/unsubscribe-token.ts`:

```ts
import encryption from "@adonisjs/core/services/encryption";

/**
 * Namespacing string. An encrypted value produced for a different purpose will
 * not decrypt here, so an unsubscribe link cannot be replayed against another
 * feature that also encrypts user ids.
 */
const PURPOSE = "prospect-email-unsubscribe";

/** One recruiting cycle plus margin, so links in a September email still work in January. */
const TTL = "1y";

export function signUnsubscribeToken(userId: string): string {
  return encryption.encrypt(userId, TTL, PURPOSE);
}

/**
 * Returns the user id, or null when the token is forged, expired, or was
 * encrypted for a different purpose.
 *
 * The old stack put the bare `users.id` in the unsubscribe URL, so anyone who
 * guessed a UUID could unsubscribe that user.
 */
export function verifyUnsubscribeToken(token: string): string | null {
  return encryption.decrypt<string>(token, PURPOSE);
}

export function unsubscribeUrl(siteUrl: string, userId: string): string {
  const base = siteUrl.replace(/\/$/, "");
  const token = encodeURIComponent(signUnsubscribeToken(userId));
  return `${base}/unsubscribe?token=${token}`;
}
```

- [ ] **Step 4: Run token tests to verify they pass**

Run: `cd apps/backend && pnpm test --files="app/shared/prospect-emails/unsubscribe-token.spec.ts"`
Expected: PASS, 5 tests

- [ ] **Step 5: Write the failing service test**

Create `apps/backend/app/modules/users/unsubscribe/service.spec.ts`:

```ts
import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { signUnsubscribeToken } from "#shared/prospect-emails/unsubscribe-token";
import { eq } from "drizzle-orm";
import { UnsubscribeService } from "./service.ts";

let seq = 0;
async function makeUser() {
  seq += 1;
  const handle = `unsub-${Date.now()}-${seq}`;
  const [user] = await db
    .insert(users)
    .values({
      username: handle,
      email: `${handle}@example.com`,
      role: "user",
      type: "school",
      displayEmail: `${handle}@example.com`,
      firstName: "Test",
      lastName: "User",
      password: "x",
      notifications: true,
    })
    .returning();
  return user!;
}

test.group("UnsubscribeService", (group) => {
  group.each.setup(async () => {
    await db.delete(users).execute();
  });

  test("sets notifications to false for a valid token", async ({ assert }) => {
    const user = await makeUser();
    const service = new UnsubscribeService();

    const ok = await service.execute(signUnsubscribeToken(user.id));

    assert.isTrue(ok);
    const [after] = await db.select().from(users).where(eq(users.id, user.id));
    assert.isFalse(after!.notifications);
  });

  test("returns false for a forged token and changes nothing", async ({ assert }) => {
    const user = await makeUser();
    const service = new UnsubscribeService();

    const ok = await service.execute("forged");

    assert.isFalse(ok);
    const [after] = await db.select().from(users).where(eq(users.id, user.id));
    assert.isTrue(after!.notifications);
  });

  test("is idempotent", async ({ assert }) => {
    const user = await makeUser();
    const service = new UnsubscribeService();
    const token = signUnsubscribeToken(user.id);

    assert.isTrue(await service.execute(token));
    assert.isTrue(await service.execute(token));

    const [after] = await db.select().from(users).where(eq(users.id, user.id));
    assert.isFalse(after!.notifications);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd apps/backend && pnpm test --files="app/modules/users/unsubscribe/service.spec.ts"`
Expected: FAIL — cannot resolve `./service.ts`

- [ ] **Step 7: Write the service and controller**

Create `apps/backend/app/modules/users/unsubscribe/service.ts`:

```ts
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { verifyUnsubscribeToken } from "#shared/prospect-emails/unsubscribe-token";
import { eq } from "drizzle-orm";

export class UnsubscribeService {
  /** Returns true when the token was valid and the user is now opted out. */
  async execute(token: string): Promise<boolean> {
    const userId = verifyUnsubscribeToken(token);

    if (!userId) {
      return false;
    }

    const updated = await db
      .update(users)
      .set({ notifications: false })
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    return updated.length > 0;
  }
}
```

Create `apps/backend/app/modules/users/unsubscribe/controller.ts`:

```ts
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { UnsubscribeService } from "./service.ts";

export default class UnsubscribeController {
  @inject()
  async handle(ctx: HttpContext, service: UnsubscribeService) {
    const token = ctx.request.input("token");

    if (typeof token !== "string" || token.length === 0) {
      return ctx.response.badRequest({ message: "Missing unsubscribe token." });
    }

    const ok = await service.execute(token);

    if (!ok) {
      return ctx.response.badRequest({
        message: "This unsubscribe link is invalid or has expired.",
      });
    }

    return ctx.response.ok({
      message: "You have been unsubscribed from Studio 2 Stadium emails.",
    });
  }
}
```

- [ ] **Step 8: Register the route**

Modify `apps/backend/app/modules/users/routes.ts`. Follow the existing structure in that file — add the controller lazy-import alongside the others and register both verbs. RFC 8058 one-click requires POST; GET is what a human clicking the link in a mail client hits.

```ts
const UnsubscribeController = () => import("./unsubscribe/controller.ts");

// inside the existing router.group(...)
router.get("unsubscribe", [UnsubscribeController]);
router.post("unsubscribe", [UnsubscribeController]);
```

Both routes must be unauthenticated — do not attach `middleware.auth()`. Read the file first; if its group is prefixed (e.g. `/users`), register these two at the top level instead so the URL matches `unsubscribeUrl()`'s `/unsubscribe` path. If a prefix is unavoidable, update `unsubscribeUrl` in `app/shared/prospect-emails/unsubscribe-token.ts` to match and re-run its spec.

- [ ] **Step 9: Run tests to verify they pass**

Run: `cd apps/backend && pnpm test --files="app/modules/users/unsubscribe/service.spec.ts"`
Expected: PASS, 3 tests

- [ ] **Step 10: Verify the route responds**

Run: `cd apps/backend && pnpm dev` in one shell, then in another:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3333/unsubscribe"
```

Expected: `400` (missing token), not `404`. A `404` means the route did not register — fix step 8 before continuing.

- [ ] **Step 11: Typecheck and commit**

```bash
cd apps/backend && pnpm typecheck
git add apps/backend/app/shared/prospect-emails/unsubscribe-token.ts apps/backend/app/shared/prospect-emails/unsubscribe-token.spec.ts apps/backend/app/modules/users/unsubscribe apps/backend/app/modules/users/routes.ts
git commit -m "feat(backend): add signed unsubscribe token and route"
```

---

### Task 5: Prospect reminder email template

**Files:**
- Create: `packages/emails/src/templates/ProspectReminderEmail.tsx`
- Modify: `packages/emails/src/index.ts`
- Create: `apps/backend/app/shared/prospect-emails/reminder-email.ts`

**Interfaces:**
- Consumes: `unsubscribeUrl` (Task 4).
- Produces:
  - `ProspectReminderEmail(props: ProspectReminderEmailProps)` — `{ reviewUrl: string }`
  - `ProspectReminderMail` — BaseMail subclass taking `{ email, userId, schoolName }`

Copy is ported from the old `ProspectEmailReminder` constant in the legacy repo at `app/src/email-templates/index.ts:1026`.

- [ ] **Step 1: Write the template**

Create `packages/emails/src/templates/ProspectReminderEmail.tsx`. Match the structure of `ShowInterestEmail.tsx` — `Layout` wrapper, `Text` with `paragraphStyle`, `Button` for the CTA.

```tsx
import { Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { Button } from "../components/Button.js";
import { paragraphStyle } from "../components/styles.js";

export interface ProspectReminderEmailProps {
  reviewUrl: string;
}

export function ProspectReminderEmail({ reviewUrl }: ProspectReminderEmailProps) {
  return (
    <Layout preview="A quick reminder to review and update your prospects">
      <Text style={paragraphStyle}>Hi Coach,</Text>
      <Text style={paragraphStyle}>
        This is a friendly reminder to log into <strong>Studio 2 Stadium</strong>{" "}
        and review your prospects. Updating each dancer&rsquo;s status (In Review,
        Released, or Accepted) gives them clarity on where they stand and helps
        bring more transparency to the recruiting process.
      </Text>
      <Text style={paragraphStyle}>
        Your updates not only guide dancers but also keep the recruiting journey
        organized and efficient for you.
      </Text>
      <Button href={reviewUrl}>Log In to Review &amp; Update Status</Button>
      <Text style={paragraphStyle}>
        Thank you for helping us build a clearer, more connected recruiting
        experience for dancers and programs alike.
      </Text>
      <Text style={paragraphStyle}>
        With appreciation,
        <br />
        Abbey &amp; The Studio 2 Stadium Team
      </Text>
    </Layout>
  );
}

export default ProspectReminderEmail;
```

- [ ] **Step 2: Export it**

Modify `packages/emails/src/index.ts` — add alongside the other template exports:

```ts
export {
  ProspectReminderEmail,
  type ProspectReminderEmailProps,
} from "./templates/ProspectReminderEmail.js";
```

- [ ] **Step 3: Write the BaseMail class**

Create `apps/backend/app/shared/prospect-emails/reminder-email.ts`. Model it on `app/shared/org/free-tier-invite-email.ts` — subclass `BaseMail`, set `subject` in the constructor, render in `prepare()`.

```ts
import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";
import { ProspectReminderEmail, renderEmail, renderEmailText } from "@stos/emails";
import { unsubscribeUrl } from "./unsubscribe-token.ts";

interface ProspectReminderMailData {
  email: string;
  userId: string;
}

export class ProspectReminderMail extends BaseMail {
  subject = "Quick Reminder: Update Your Prospect Statuses";

  constructor(private data: ProspectReminderMailData) {
    super();
  }

  async prepare() {
    const siteUrl = env.get("SITE_URL").replace(/\/$/, "");
    const template = ProspectReminderEmail({
      reviewUrl: `${siteUrl}/school/common-recruiting-videos`,
    });

    this.message.to(this.data.email);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));

    // RFC 8058: one-click unsubscribe. Both headers are required — mailbox
    // providers ignore List-Unsubscribe-Post without List-Unsubscribe.
    const url = unsubscribeUrl(siteUrl, this.data.userId);
    this.message.header("List-Unsubscribe", `<${url}>`);
    this.message.header("List-Unsubscribe-Post", "List-Unsubscribe=One-Click");
  }
}
```

- [ ] **Step 4: Build the emails package and typecheck**

Run: `cd packages/emails && pnpm build 2>/dev/null || true; cd ../../apps/backend && pnpm typecheck`
Expected: no errors. If `@stos/emails` does not resolve the new export, check whether `packages/emails` has a build step in its `package.json` and run it.

- [ ] **Step 5: Commit**

```bash
git add packages/emails/src/templates/ProspectReminderEmail.tsx packages/emails/src/index.ts apps/backend/app/shared/prospect-emails/reminder-email.ts
git commit -m "feat(emails): add prospect reminder template"
```

---

### Task 6: Prospect reminder service

**Files:**
- Create: `apps/backend/services/send-prospect-reminders.ts`
- Test: `apps/backend/services/send-prospect-reminders.spec.ts`
- Modify: `apps/backend/adonisrc.ts`

**Interfaces:**
- Consumes: `findProspectEmailRecipients` (Task 3), `ProspectReminderMail` (Task 5), `env.get("CRON_EMAILS_ENABLED")` (Task 1).
- Produces:
  - `interface ProspectJobResult { recipients: number; sent: number; failed: number; skipped: boolean; dryRun: boolean }`
  - `SendProspectRemindersService.run(opts?: { dryRun?: boolean }): Promise<ProspectJobResult>`

`adonisrc.ts` currently globs `app/modules/**`, `app/shared/**`, `app/utils/**`, `app/middleware/**`, `commands/**` and `tests/**` — but **not** `services/**`, where the four existing cron services live. Without adding it, this spec silently never runs.

- [ ] **Step 1: Add the services test glob**

Modify `apps/backend/adonisrc.ts` — in the `functional` suite's `files` array, add:

```ts
          "services/**/*.spec.ts",
```

- [ ] **Step 2: Write the failing test**

Create `apps/backend/services/send-prospect-reminders.spec.ts`. Use `mail.fake()` from `@adonisjs/mail/services/main` so nothing reaches SES.

```ts
import { test } from "@japa/runner";
import mail from "@adonisjs/mail/services/main";
import { db } from "#database/connection";
import { crvSubmissions } from "#database/schema/crv";
import { dancerProfiles } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import SendProspectRemindersService from "./send-prospect-reminders.ts";

let seq = 0;
async function makeSchoolWithPendingSubmission() {
  seq += 1;
  const handle = `rem-${Date.now()}-${seq}`;

  const [schoolUser] = await db
    .insert(users)
    .values({
      username: handle,
      email: `${handle}@example.com`,
      role: "user",
      type: "school",
      displayEmail: `${handle}@example.com`,
      firstName: "Test",
      lastName: "School",
      password: "x",
      notifications: true,
    })
    .returning();

  const [school] = await db
    .insert(schoolProfiles)
    .values({ userId: schoolUser!.id, name: `School ${handle}`, location: "CO" })
    .returning();

  const [dancerUser] = await db
    .insert(users)
    .values({
      username: `${handle}-d`,
      email: `${handle}-d@example.com`,
      role: "user",
      type: "dancer",
      displayEmail: `${handle}-d@example.com`,
      firstName: "Test",
      lastName: "Dancer",
      password: "x",
    })
    .returning();

  const [dancer] = await db
    .insert(dancerProfiles)
    .values({ userId: dancerUser!.id, birthday: "2006-01-01", location: "CO" })
    .returning();

  await db
    .insert(crvSubmissions)
    .values({ dancerId: dancer!.id, schoolId: school!.id, status: "pending" });

  return { schoolUser: schoolUser!, school: school! };
}

test.group("SendProspectRemindersService", (group) => {
  group.each.setup(async () => {
    await db.delete(crvSubmissions).execute();
    await db.delete(dancerProfiles).execute();
    await db.delete(schoolProfiles).execute();
    await db.delete(users).execute();
  });

  group.each.teardown(() => {
    mail.restore();
  });

  test("dry run resolves recipients but sends nothing", async ({ assert }) => {
    await makeSchoolWithPendingSubmission();
    const mailer = mail.fake();

    const result = await new SendProspectRemindersService().run({ dryRun: true });

    assert.equal(result.recipients, 1);
    assert.equal(result.sent, 0);
    assert.isTrue(result.dryRun);
    assert.isFalse(mailer.exists({ subject: "Quick Reminder: Update Your Prospect Statuses" }));
  });

  test("sends one email per recipient when enabled", async ({ assert }) => {
    const { schoolUser } = await makeSchoolWithPendingSubmission();
    const mailer = mail.fake();

    const result = await new SendProspectRemindersService({
      enabled: true,
    }).run();

    assert.equal(result.recipients, 1);
    assert.equal(result.sent, 1);
    assert.equal(result.failed, 0);
    assert.isFalse(result.skipped);
    assert.isTrue(mailer.exists({ to: [{ address: schoolUser.email }] }));
  });

  test("skips entirely when the kill switch is off", async ({ assert }) => {
    await makeSchoolWithPendingSubmission();
    const mailer = mail.fake();

    const result = await new SendProspectRemindersService({
      enabled: false,
    }).run();

    assert.isTrue(result.skipped);
    assert.equal(result.sent, 0);
    assert.isFalse(mailer.exists({ subject: "Quick Reminder: Update Your Prospect Statuses" }));
  });

  test("one failure does not abort the rest", async ({ assert }) => {
    await makeSchoolWithPendingSubmission();
    await makeSchoolWithPendingSubmission();
    const mailer = mail.fake();

    let call = 0;
    const original = mailer.send.bind(mailer);
    mailer.send = (async (...args: unknown[]) => {
      call += 1;
      if (call === 1) throw new Error("ses rejected");
      return await (original as (...a: unknown[]) => Promise<unknown>)(...args);
    }) as typeof mailer.send;

    const result = await new SendProspectRemindersService({ enabled: true }).run();

    assert.equal(result.recipients, 2);
    assert.equal(result.sent, 1);
    assert.equal(result.failed, 1);
  });
});
```

If `mail.fake()`'s assertion API differs in `@adonisjs/mail` v10 (check `node_modules/@adonisjs/mail/build/src/messages_list.d.ts` for the available matchers), adapt the `exists(...)` calls but keep the counts asserted on `result`.

- [ ] **Step 3: Run test to verify it fails**

Run: `cd apps/backend && pnpm test --files="services/send-prospect-reminders.spec.ts"`
Expected: FAIL — cannot resolve `./send-prospect-reminders.ts`. If it instead reports **zero tests found**, step 1 was not applied correctly.

- [ ] **Step 4: Write the service**

Create `apps/backend/services/send-prospect-reminders.ts`:

```ts
import env from "#start/env";
import { findProspectEmailRecipients } from "#shared/prospect-emails/recipients";
import { ProspectReminderMail } from "#shared/prospect-emails/reminder-email";
import mail from "@adonisjs/mail/services/main";

export interface ProspectJobResult {
  recipients: number;
  sent: number;
  failed: number;
  skipped: boolean;
  dryRun: boolean;
}

interface Options {
  /** Overrides CRON_EMAILS_ENABLED. Tests pass this explicitly. */
  enabled?: boolean;
}

export default class SendProspectRemindersService {
  constructor(private options: Options = {}) {}

  async run(opts: { dryRun?: boolean } = {}): Promise<ProspectJobResult> {
    const dryRun = opts.dryRun ?? false;
    const enabled = this.options.enabled ?? env.get("CRON_EMAILS_ENABLED") === true;

    const recipients = await findProspectEmailRecipients();

    if (!dryRun && !enabled) {
      console.log(
        `[ProspectReminder]: CRON_EMAILS_ENABLED is off; skipping ${recipients.length} recipient(s)`
      );
      return {
        recipients: recipients.length,
        sent: 0,
        failed: 0,
        skipped: true,
        dryRun,
      };
    }

    if (dryRun) {
      for (const r of recipients) {
        console.log(`[ProspectReminder][dry-run]: would email ${r.email} (${r.schoolName})`);
      }
      return {
        recipients: recipients.length,
        sent: 0,
        failed: 0,
        skipped: false,
        dryRun,
      };
    }

    let sent = 0;
    let failed = 0;

    // Sequential, not Promise.all: SES throttles, and a monthly job has no
    // latency budget worth risking a rate-limit rejection for.
    for (const recipient of recipients) {
      try {
        await mail.send(
          new ProspectReminderMail({
            email: recipient.email,
            userId: recipient.userId,
          })
        );
        sent += 1;
      } catch (error) {
        failed += 1;
        console.error(
          `[ProspectReminder]: failed to email ${recipient.email}:`,
          error
        );
      }
    }

    console.log(
      `[ProspectReminder]: sent ${sent}/${recipients.length}, ${failed} failed`
    );

    return { recipients: recipients.length, sent, failed, skipped: false, dryRun };
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/backend && pnpm test --files="services/send-prospect-reminders.spec.ts"`
Expected: PASS, 4 tests

- [ ] **Step 6: Commit**

```bash
git add apps/backend/services/send-prospect-reminders.ts apps/backend/services/send-prospect-reminders.spec.ts apps/backend/adonisrc.ts
git commit -m "feat(backend): add prospect reminder job service"
```

---

### Task 7: Submissions digest email template

**Files:**
- Create: `packages/emails/src/templates/ProspectSubmissionsDigestEmail.tsx`
- Modify: `packages/emails/src/index.ts`
- Create: `apps/backend/app/shared/prospect-emails/digest-email.ts`

**Interfaces:**
- Consumes: `unsubscribeUrl` (Task 4).
- Produces:
  - `interface DigestDancer { name: string; profileUrl: string }`
  - `ProspectSubmissionsDigestEmail(props)` — `{ schoolName, newSubmissions: DigestDancer[], earlySubmissions: DigestDancer[], reviewUrl }`
  - `ProspectDigestMail` — BaseMail taking `{ email, userId, schoolName, newSubmissions, earlySubmissions }`

Named `ProspectSubmissionsDigestEmail`, **not** `ProspectStatusEmail` — that name is a live dancer-facing email.

- [ ] **Step 1: Write the template**

Create `packages/emails/src/templates/ProspectSubmissionsDigestEmail.tsx`:

```tsx
import { Heading, Link, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { Button } from "../components/Button.js";
import {
  linkStyle,
  listItemStyle,
  listStyle,
  paragraphStyle,
} from "../components/styles.js";

export interface DigestDancer {
  name: string;
  profileUrl: string;
}

export interface ProspectSubmissionsDigestEmailProps {
  schoolName: string;
  newSubmissions: DigestDancer[];
  earlySubmissions: DigestDancer[];
  reviewUrl: string;
}

function DancerList({ dancers }: { dancers: DigestDancer[] }) {
  if (dancers.length === 0) {
    return <Text style={paragraphStyle}>No submissions in this group.</Text>;
  }

  return (
    <ul style={listStyle}>
      {dancers.map((dancer) => (
        <li key={dancer.profileUrl} style={listItemStyle}>
          <Link href={dancer.profileUrl} style={linkStyle}>
            {dancer.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ProspectSubmissionsDigestEmail({
  schoolName,
  newSubmissions,
  earlySubmissions,
  reviewUrl,
}: ProspectSubmissionsDigestEmailProps) {
  return (
    <Layout preview={`Recruiting submissions ready for ${schoolName} to review`}>
      <Text style={paragraphStyle}>Hi {schoolName},</Text>
      <Text style={paragraphStyle}>
        Your latest recruiting video submissions are ready for review on Studio 2
        Stadium. You can set each prospect&rsquo;s status to{" "}
        <strong>In Review</strong>, <strong>Released</strong>, or{" "}
        <strong>Accepted</strong>.
      </Text>

      <Heading as="h2" style={{ fontSize: "18px", margin: "24px 0 8px" }}>
        New Submissions
      </Heading>
      <DancerList dancers={newSubmissions} />

      <Heading as="h2" style={{ fontSize: "18px", margin: "24px 0 8px" }}>
        Early Submissions
      </Heading>
      <DancerList dancers={earlySubmissions} />

      <Button href={reviewUrl}>Update Status</Button>
    </Layout>
  );
}

export default ProspectSubmissionsDigestEmail;
```

- [ ] **Step 2: Export it**

Modify `packages/emails/src/index.ts`:

```ts
export {
  ProspectSubmissionsDigestEmail,
  type ProspectSubmissionsDigestEmailProps,
  type DigestDancer,
} from "./templates/ProspectSubmissionsDigestEmail.js";
```

- [ ] **Step 3: Write the BaseMail class**

Create `apps/backend/app/shared/prospect-emails/digest-email.ts`:

```ts
import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";
import {
  ProspectSubmissionsDigestEmail,
  renderEmail,
  renderEmailText,
  type DigestDancer,
} from "@stos/emails";
import { unsubscribeUrl } from "./unsubscribe-token.ts";

interface ProspectDigestMailData {
  email: string;
  userId: string;
  schoolName: string;
  newSubmissions: DigestDancer[];
  earlySubmissions: DigestDancer[];
}

export class ProspectDigestMail extends BaseMail {
  subject = "Your Studio 2 Stadium Recruiting Submissions";

  constructor(private data: ProspectDigestMailData) {
    super();
  }

  async prepare() {
    const siteUrl = env.get("SITE_URL").replace(/\/$/, "");
    const template = ProspectSubmissionsDigestEmail({
      schoolName: this.data.schoolName,
      newSubmissions: this.data.newSubmissions,
      earlySubmissions: this.data.earlySubmissions,
      reviewUrl: `${siteUrl}/school/common-recruiting-videos`,
    });

    this.message.to(this.data.email);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));

    const url = unsubscribeUrl(siteUrl, this.data.userId);
    this.message.header("List-Unsubscribe", `<${url}>`);
    this.message.header("List-Unsubscribe-Post", "List-Unsubscribe=One-Click");
  }
}
```

- [ ] **Step 4: Typecheck and commit**

```bash
cd apps/backend && pnpm typecheck
git add packages/emails/src/templates/ProspectSubmissionsDigestEmail.tsx packages/emails/src/index.ts apps/backend/app/shared/prospect-emails/digest-email.ts
git commit -m "feat(emails): add prospect submissions digest template"
```

---

### Task 8: Submissions digest service

**Files:**
- Create: `apps/backend/services/send-prospect-digest.ts`
- Test: `apps/backend/services/send-prospect-digest.spec.ts`

**Interfaces:**
- Consumes: `findProspectEmailRecipients` (Task 3), `mostRecentAugustFirst` (Task 2), `ProspectDigestMail` (Task 7).
- Produces:
  - `interface DigestBucketCount { schoolId: string; early: number; fresh: number }`
  - `interface ProspectDigestResult` — the same five fields as `ProspectJobResult` (Task 6) plus `buckets: DigestBucketCount[]`. It is a separate type, not an import; the ace command in Task 9 reads only the five shared fields, so the union it forms typechecks.
  - `SendProspectDigestService.run(opts?: { dryRun?: boolean; now?: Date }): Promise<ProspectDigestResult>`

- [ ] **Step 1: Write the failing test**

Create `apps/backend/services/send-prospect-digest.spec.ts`. Reuse the fixture shape from Task 6's spec, but insert submissions with explicit `createdAt` values straddling August 1.

```ts
import { test } from "@japa/runner";
import mail from "@adonisjs/mail/services/main";
import { DateTime } from "luxon";
import { db } from "#database/connection";
import { crvSubmissions } from "#database/schema/crv";
import { dancerProfiles } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { PROSPECT_TZ } from "#shared/prospect-emails/cutoff";
import SendProspectDigestService from "./send-prospect-digest.ts";

let seq = 0;

async function makeDancer(label: string) {
  seq += 1;
  const handle = `dig-d-${Date.now()}-${seq}-${label}`;
  const [user] = await db
    .insert(users)
    .values({
      username: handle,
      email: `${handle}@example.com`,
      role: "user",
      type: "dancer",
      displayEmail: `${handle}@example.com`,
      firstName: "Dan",
      lastName: label,
      password: "x",
    })
    .returning();
  const [dancer] = await db
    .insert(dancerProfiles)
    .values({ userId: user!.id, birthday: "2006-01-01", location: "CO" })
    .returning();
  return dancer!;
}

async function makeSchool() {
  seq += 1;
  const handle = `dig-s-${Date.now()}-${seq}`;
  const [user] = await db
    .insert(users)
    .values({
      username: handle,
      email: `${handle}@example.com`,
      role: "user",
      type: "school",
      displayEmail: `${handle}@example.com`,
      firstName: "Test",
      lastName: "School",
      password: "x",
      notifications: true,
    })
    .returning();
  const [school] = await db
    .insert(schoolProfiles)
    .values({ userId: user!.id, name: `School ${handle}`, location: "CO" })
    .returning();
  return { user: user!, school: school! };
}

function denver(iso: string) {
  return DateTime.fromISO(iso, { zone: PROSPECT_TZ }).toJSDate();
}

test.group("SendProspectDigestService", (group) => {
  group.each.setup(async () => {
    await db.delete(crvSubmissions).execute();
    await db.delete(dancerProfiles).execute();
    await db.delete(schoolProfiles).execute();
    await db.delete(users).execute();
  });

  group.each.teardown(() => {
    mail.restore();
  });

  test("splits submissions on the most recent August 1", async ({ assert }) => {
    const { school } = await makeSchool();
    const early = await makeDancer("early");
    const recent = await makeDancer("recent");

    await db.insert(crvSubmissions).values([
      {
        dancerId: early.id,
        schoolId: school.id,
        status: "pending",
        createdAt: denver("2026-06-15T12:00:00"),
      },
      {
        dancerId: recent.id,
        schoolId: school.id,
        status: "pending",
        createdAt: denver("2026-09-20T12:00:00"),
      },
    ]);

    mail.fake();

    const service = new SendProspectDigestService({ enabled: true });
    const result = await service.run({
      dryRun: true,
      now: denver("2027-01-02T09:00:00"),
    });

    assert.equal(result.recipients, 1);
    assert.deepEqual(result.buckets, [{ schoolId: school.id, early: 1, fresh: 1 }]);
  });

  test("a January run does not put everything in early", async ({ assert }) => {
    const { school } = await makeSchool();
    const dancer = await makeDancer("after-aug");

    await db.insert(crvSubmissions).values({
      dancerId: dancer.id,
      schoolId: school.id,
      status: "pending",
      createdAt: denver("2026-10-01T12:00:00"),
    });

    mail.fake();

    const result = await new SendProspectDigestService({ enabled: true }).run({
      dryRun: true,
      now: denver("2027-01-02T09:00:00"),
    });

    assert.deepEqual(result.buckets, [{ schoolId: school.id, early: 0, fresh: 1 }]);
  });

  test("sends one digest per recipient when enabled", async ({ assert }) => {
    const { school, user } = await makeSchool();
    const dancer = await makeDancer("x");
    await db.insert(crvSubmissions).values({
      dancerId: dancer.id,
      schoolId: school.id,
      status: "pending",
      createdAt: denver("2026-09-01T12:00:00"),
    });

    const mailer = mail.fake();

    const result = await new SendProspectDigestService({ enabled: true }).run({
      now: denver("2027-01-02T09:00:00"),
    });

    assert.equal(result.sent, 1);
    assert.isTrue(mailer.exists({ to: [{ address: user.email }] }));
  });

  test("skips entirely when the kill switch is off", async ({ assert }) => {
    const { school } = await makeSchool();
    const dancer = await makeDancer("y");
    await db.insert(crvSubmissions).values({
      dancerId: dancer.id,
      schoolId: school.id,
      status: "pending",
      createdAt: denver("2026-09-01T12:00:00"),
    });

    mail.fake();

    const result = await new SendProspectDigestService({ enabled: false }).run({
      now: denver("2027-01-02T09:00:00"),
    });

    assert.isTrue(result.skipped);
    assert.equal(result.sent, 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && pnpm test --files="services/send-prospect-digest.spec.ts"`
Expected: FAIL — cannot resolve `./send-prospect-digest.ts`

- [ ] **Step 3: Write the service**

Create `apps/backend/services/send-prospect-digest.ts`. Note `ProspectJobResult` is extended with `buckets` for dry-run inspection.

```ts
import env from "#start/env";
import { db } from "#database/connection";
import { crvSubmissions } from "#database/schema/crv";
import { dancerProfiles } from "#database/schema/dancers";
import { users } from "#database/schema/users";
import { mostRecentAugustFirst } from "#shared/prospect-emails/cutoff";
import { ProspectDigestMail } from "#shared/prospect-emails/digest-email";
import { findProspectEmailRecipients } from "#shared/prospect-emails/recipients";
import mail from "@adonisjs/mail/services/main";
import type { DigestDancer } from "@stos/emails";
import { and, eq, inArray } from "drizzle-orm";

export interface DigestBucketCount {
  schoolId: string;
  early: number;
  fresh: number;
}

export interface ProspectDigestResult {
  recipients: number;
  sent: number;
  failed: number;
  skipped: boolean;
  dryRun: boolean;
  buckets: DigestBucketCount[];
}

interface Options {
  enabled?: boolean;
}

export default class SendProspectDigestService {
  constructor(private options: Options = {}) {}

  async run(
    opts: { dryRun?: boolean; now?: Date } = {}
  ): Promise<ProspectDigestResult> {
    const dryRun = opts.dryRun ?? false;
    const now = opts.now ?? new Date();
    const enabled = this.options.enabled ?? env.get("CRON_EMAILS_ENABLED") === true;

    const cutoff = mostRecentAugustFirst(now);
    const recipients = await findProspectEmailRecipients();

    if (recipients.length === 0) {
      return { recipients: 0, sent: 0, failed: 0, skipped: false, dryRun, buckets: [] };
    }

    const siteUrl = env.get("SITE_URL").replace(/\/$/, "");

    const rows = await db
      .select({
        schoolId: crvSubmissions.schoolId,
        createdAt: crvSubmissions.createdAt,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(crvSubmissions)
      .innerJoin(dancerProfiles, eq(crvSubmissions.dancerId, dancerProfiles.id))
      .innerJoin(users, eq(dancerProfiles.userId, users.id))
      .where(
        and(
          inArray(crvSubmissions.status, ["pending", "in_review"]),
          inArray(
            crvSubmissions.schoolId,
            recipients.map((r) => r.schoolId)
          )
        )
      );

    const bySchool = new Map<string, { early: DigestDancer[]; fresh: DigestDancer[] }>();

    for (const row of rows) {
      const bucket =
        bySchool.get(row.schoolId) ?? { early: [], fresh: [] };

      const dancer: DigestDancer = {
        name: `${row.firstName} ${row.lastName}`.trim(),
        profileUrl: `${siteUrl}/dancer/${row.username}`,
      };

      if (row.createdAt < cutoff) {
        bucket.early.push(dancer);
      } else {
        bucket.fresh.push(dancer);
      }

      bySchool.set(row.schoolId, bucket);
    }

    const buckets: DigestBucketCount[] = recipients.map((r) => {
      const b = bySchool.get(r.schoolId) ?? { early: [], fresh: [] };
      return { schoolId: r.schoolId, early: b.early.length, fresh: b.fresh.length };
    });

    if (!dryRun && !enabled) {
      console.log(
        `[ProspectDigest]: CRON_EMAILS_ENABLED is off; skipping ${recipients.length} recipient(s)`
      );
      return {
        recipients: recipients.length,
        sent: 0,
        failed: 0,
        skipped: true,
        dryRun,
        buckets,
      };
    }

    if (dryRun) {
      for (const r of recipients) {
        const b = bySchool.get(r.schoolId) ?? { early: [], fresh: [] };
        console.log(
          `[ProspectDigest][dry-run]: would email ${r.email} (${r.schoolName}) — ${b.fresh.length} new, ${b.early.length} early`
        );
      }
      return {
        recipients: recipients.length,
        sent: 0,
        failed: 0,
        skipped: false,
        dryRun,
        buckets,
      };
    }

    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const bucket = bySchool.get(recipient.schoolId) ?? { early: [], fresh: [] };

      try {
        await mail.send(
          new ProspectDigestMail({
            email: recipient.email,
            userId: recipient.userId,
            schoolName: recipient.schoolName,
            newSubmissions: bucket.fresh,
            earlySubmissions: bucket.early,
          })
        );
        sent += 1;
      } catch (error) {
        failed += 1;
        console.error(`[ProspectDigest]: failed to email ${recipient.email}:`, error);
      }
    }

    console.log(
      `[ProspectDigest]: cutoff ${cutoff.toISOString()}, sent ${sent}/${recipients.length}, ${failed} failed`
    );

    return { recipients: recipients.length, sent, failed, skipped: false, dryRun, buckets };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/backend && pnpm test --files="services/send-prospect-digest.spec.ts"`
Expected: PASS, 4 tests

- [ ] **Step 5: Commit**

```bash
git add apps/backend/services/send-prospect-digest.ts apps/backend/services/send-prospect-digest.spec.ts
git commit -m "feat(backend): add prospect submissions digest job service"
```

---

### Task 9: Ace command with dry run

**Files:**
- Create: `apps/backend/commands/send-prospect-emails.ts`

**Interfaces:**
- Consumes: `SendProspectRemindersService` (Task 6), `SendProspectDigestService` (Task 8).
- Produces: `node ace send:prospect-emails <job> [--dry-run]` where `job` is `reminder` or `digest`.

Model on `apps/backend/commands/sweep-blog-orphans.ts` — read it first for the `BaseCommand` / `flags` / `CommandOptions` shape.

- [ ] **Step 1: Write the command**

Create `apps/backend/commands/send-prospect-emails.ts`:

```ts
import { args, BaseCommand, flags } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import SendProspectDigestService from "../services/send-prospect-digest.ts";
import SendProspectRemindersService from "../services/send-prospect-reminders.ts";

/**
 * Manual entry point for the two prospect email jobs.
 *
 * The app has no staging environment — `studio2stadium-dev` serves
 * api.studio2stadium.com — so always run with --dry-run first and read the
 * recipient list before sending for real.
 */
export default class SendProspectEmails extends BaseCommand {
  static commandName = "send:prospect-emails";
  static description =
    "Send the prospect reminder or submissions digest email (use --dry-run first)";

  static options: CommandOptions = {
    startApp: true,
  };

  @args.string({
    description: "Which job to run: 'reminder' or 'digest'",
  })
  declare job: string;

  @flags.boolean({
    description: "Resolve recipients and log them without sending anything",
    default: false,
  })
  declare dryRun: boolean;

  async run() {
    if (this.job !== "reminder" && this.job !== "digest") {
      this.logger.error(`Unknown job '${this.job}'. Expected 'reminder' or 'digest'.`);
      this.exitCode = 1;
      return;
    }

    const result =
      this.job === "reminder"
        ? await new SendProspectRemindersService().run({ dryRun: this.dryRun })
        : await new SendProspectDigestService().run({ dryRun: this.dryRun });

    if (result.skipped) {
      this.logger.warning(
        `Skipped: CRON_EMAILS_ENABLED is not true. ${result.recipients} recipient(s) would have been emailed.`
      );
      return;
    }

    if (result.dryRun) {
      this.logger.info(`Dry run: ${result.recipients} recipient(s), nothing sent.`);
      return;
    }

    this.logger.success(
      `Sent ${result.sent}/${result.recipients}, ${result.failed} failed.`
    );

    if (result.failed > 0) {
      this.exitCode = 1;
    }
  }
}
```

- [ ] **Step 2: Verify the command registers**

Run: `cd apps/backend && node ace list | rg "send:prospect-emails"`
Expected: the command appears. If not, check whether `adonisrc.ts` needs the command added to its `commands` array — read how `sweep:blog-orphans` is discovered and match it.

- [ ] **Step 3: Verify dry run against the dev database**

Run: `cd apps/backend && node ace send:prospect-emails reminder --dry-run`
Expected: exits 0, logs `Dry run: N recipient(s), nothing sent.` and one `[ProspectReminder][dry-run]` line per recipient. No mail is sent.

Run: `cd apps/backend && node ace send:prospect-emails digest --dry-run`
Expected: exits 0, logs per-recipient new/early counts.

- [ ] **Step 4: Verify the guard rejects a bad job name**

Run: `cd apps/backend && node ace send:prospect-emails nonsense; echo "exit=$?"`
Expected: `exit=1` and an "Unknown job" error.

- [ ] **Step 5: Typecheck and commit**

```bash
cd apps/backend && pnpm typecheck
git add apps/backend/commands/send-prospect-emails.ts
git commit -m "feat(backend): add send:prospect-emails ace command with dry run"
```

---

### Task 10: Register both cron jobs

**Files:**
- Modify: `apps/backend/start/cron.ts`

**Interfaces:**
- Consumes: `withAdvisoryLock`, `PROSPECT_REMINDER_LOCK_KEY`, `PROSPECT_DIGEST_LOCK_KEY` (Task 1); both services (Tasks 6, 8).
- Produces: three registered `CronJob`s.

The four existing jobs in this file are intentionally left unchanged.

- [ ] **Step 1: Add the imports**

Modify `apps/backend/start/cron.ts` — add to the existing import block:

```ts
import {
  PROSPECT_DIGEST_LOCK_KEY,
  PROSPECT_REMINDER_LOCK_KEY,
  withAdvisoryLock,
} from "#shared/cron/advisory-lock";
import SendProspectDigestService from "../services/send-prospect-digest.ts";
import SendProspectRemindersService from "../services/send-prospect-reminders.ts";
```

- [ ] **Step 2: Register the jobs**

Append to `apps/backend/start/cron.ts`:

```ts
const PROSPECT_TIMEZONE = "America/Denver";

const sendProspectRemindersService = new SendProspectRemindersService();
const sendProspectDigestService = new SendProspectDigestService();

/**
 * Prospect status reminder — 1st of the month at midnight Denver, every month
 * except January and September. Those two months get the submissions digest
 * below instead. Expression is carried over unchanged from the retired
 * EventBridge schedule `sendProspectReminder`.
 */
CronJob.from({
  cronTime: "0 0 1 10,11,12,2,3,4,5,6,7,8 *",
  timeZone: PROSPECT_TIMEZONE,
  waitForCompletion: true,
  start: true,
  onTick: async () => {
    try {
      const ran = await withAdvisoryLock(PROSPECT_REMINDER_LOCK_KEY, () =>
        sendProspectRemindersService.run()
      );
      if (ran === null) {
        console.log("[ProspectReminder]: another machine holds the lock; skipping");
      }
    } catch (error) {
      console.error("[ProspectReminder]: job failed:", error);
    }
  },
});

/**
 * Submissions digest — September 1 and January 2, both 09:00 Denver. Two
 * registrations rather than one expression so each date reads plainly.
 */
for (const [label, cronTime] of [
  ["september", "0 9 1 9 *"],
  ["january", "0 9 2 1 *"],
] as const) {
  CronJob.from({
    cronTime,
    timeZone: PROSPECT_TIMEZONE,
    waitForCompletion: true,
    start: true,
    onTick: async () => {
      try {
        const ran = await withAdvisoryLock(PROSPECT_DIGEST_LOCK_KEY, () =>
          sendProspectDigestService.run()
        );
        if (ran === null) {
          console.log(
            `[ProspectDigest][${label}]: another machine holds the lock; skipping`
          );
        }
      } catch (error) {
        console.error(`[ProspectDigest][${label}]: job failed:`, error);
      }
    },
  });
}
```

- [ ] **Step 3: Verify the app boots and schedules resolve**

Run: `cd apps/backend && pnpm dev`
Expected: the server starts with no errors. Leave it running for step 4.

- [ ] **Step 4: Verify the next run times are correct**

Run in a second shell:

```bash
cd apps/backend && node --input-type=module -e "
import { CronJob } from 'cron';
for (const [label, t] of [['reminder','0 0 1 10,11,12,2,3,4,5,6,7,8 *'],['september','0 9 1 9 *'],['january','0 9 2 1 *']]) {
  const j = CronJob.from({ cronTime: t, timeZone: 'America/Denver', onTick: () => {}, start: false });
  console.log(label, '->', j.nextDate().toISO());
}
"
```

Expected: `september` resolves to the next Sept 1 at 09:00 −06:00/−07:00, `january` to the next Jan 2 at 09:00, and `reminder` to the 1st of the next month that is not January or September, at 00:00. If any timezone offset reads `Z`, the `timeZone` option was dropped — fix before continuing.

- [ ] **Step 5: Run the full test suite**

Run: `cd apps/backend && pnpm test`
Expected: all suites pass.

- [ ] **Step 6: Lint, typecheck, commit**

```bash
cd apps/backend && pnpm lint && pnpm typecheck
git add apps/backend/start/cron.ts
git commit -m "feat(backend): schedule prospect reminder and digest cron jobs"
```

---

### Task 11: Production rollout and AWS teardown

**Files:** none — this is deploy and infrastructure work.

**Interfaces:**
- Consumes: everything above.
- Produces: a working live schedule and four deleted AWS resources.

Do not begin until Tasks 1–10 are merged and deployed.

- [ ] **Step 1: Deploy with the kill switch off**

Deploy to Fly. Do **not** set `CRON_EMAILS_ENABLED`. Confirm both machines are healthy:

```bash
flyctl machines list -a studio2stadium-dev
```

Expected: 2 machines `started`, checks passing.

- [ ] **Step 2: Dry run against production data**

```bash
flyctl ssh console -a studio2stadium-dev -C "node ace send:prospect-emails reminder --dry-run"
flyctl ssh console -a studio2stadium-dev -C "node ace send:prospect-emails digest --dry-run"
```

Read the recipient lists. Confirm the counts are plausible and that the digest shows non-zero counts in **both** buckets for at least some schools — if every school shows `0 new`, the cutoff logic is wrong and Task 2 needs revisiting before any real send.

- [ ] **Step 3: Send one real email to yourself**

Temporarily set a `notifications = true` school account you control as the only match, or send via a one-off script using `ProspectReminderMail` directly. Verify in the received message:
- Subject is exactly `Quick Reminder: Update Your Prospect Statuses`
- The `List-Unsubscribe` header is present and its URL returns 200
- Clicking unsubscribe flips `users.notifications` to false
- The CTA links to `/school/common-recruiting-videos`

- [ ] **Step 4: Enable the kill switch**

```bash
flyctl secrets set CRON_EMAILS_ENABLED=true -a studio2stadium-dev
```

This restarts the machines. Confirm both come back healthy.

- [ ] **Step 5: Verify one real scheduled run**

Wait for the next monthly reminder tick (1st of the month, 00:00 Denver). Check logs:

```bash
flyctl logs -a studio2stadium-dev | rg "ProspectReminder"
```

Expected: exactly one `sent N/N` line, and one `another machine holds the lock; skipping` line from the other machine. **Two `sent` lines means the lock is not working — disable `CRON_EMAILS_ENABLED` immediately and fix Task 1.**

- [ ] **Step 6: Delete the AWS resources**

Only after step 5 confirms a clean run:

```bash
aws scheduler delete-schedule --name sendProspectReminder
aws scheduler delete-schedule --name sendProspectStatusJanuary2nd
aws lambda delete-function --function-name sendProspectEmailReminderMonthly
aws lambda delete-function --function-name sendProspectStatusJanuary
```

- [ ] **Step 7: Verify teardown**

```bash
aws scheduler list-schedules --query "Schedules[].Name" --output text
aws lambda list-functions --query "Functions[?contains(FunctionName,'Prospect')].FunctionName" --output text
```

Expected: no `sendProspectReminder`, no `sendProspectStatusJanuary2nd`, no Prospect Lambdas. The school newsletter schedules (`send-weekly-report-to-schools*`) must still be present — they are out of scope and separately broken.

- [ ] **Step 8: Commit the rollout note**

Append a short "Rolled out YYYY-MM-DD" note to the spec's teardown section recording which resources were deleted, then:

```bash
git add docs/superpowers/specs/2026-08-06-prospect-emails-migration-design.md
git commit -m "docs(backend): record prospect email migration rollout"
```

---

## Deferred

Not in this plan, by decision in the spec:

- `send-weekly-report-to-schools` and `send-weekly-report-to-schools-third-sundays` → `sendSchoolWeeklyNewsletter`. Same dead-shim pattern, equally broken, separate migration.
- Duplicate-fire on the four pre-existing jobs in `start/cron.ts`. `PublishOutboxService` in particular runs every 10 seconds on both machines and can double-publish to SQS.
- A frontend page for the unsubscribe route. It currently returns JSON.

## Known Risk

`auto_stop_machines` is `'off'` with `min_machines_running = 2`, so ticks land. If autostop is ever enabled and the app scales to zero, a scheduled tick is missed silently with no retry — a property the retired EventBridge trigger did provide. Anyone changing `fly.toml`'s machine settings needs to know these jobs depend on a machine being awake.
