# Summit Plan 05 — Dancer Profile & School Selections

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Give dancers an event-scoped profile they can edit, and a privacy-critical school-selection picker where they pick their top N schools. Coaches only ever see a boolean "did this dancer pick my school?" — never the other picks or the ranking.

**Architecture:** One new table (`event_school_selections`) with three access tiers resolved server-side: dancer CRUD on their own rows, coach read-only boolean for their own roster id, admin full read. The frontend is a dancer-facing picker with explicit reassurance UX. Profile edits write to `event_dancer_profiles` (bio/extra only for existing S2S dancers) and `dancer_profiles` (the canonical source-of-truth for typed fields like gpa, grad_year, studio, state, height, dance_styles, profile_photo).

**Tech Stack:** Adonis 6, Drizzle, VineJS, React 19, shadcn/ui.

**Source spec sections:** 2 (Profile data strategy), 3 (event_school_selections), 4 (dancer routes), 5 (dancer frontend).

**Depends on:** Plans 01, 02, 03.

---

## UX Concerns Folded In

- **Privacy trust is the product here.** The picker must say in plain language *before* the dancer selects anything: "Only you and event organizers can see your picks. Coaches will only know if you picked their school, nothing else." This is inline copy above the picker, not a tooltip.
- **Selection is a peak moment.** Submitting the top-3 deserves confirmation flair — a brief animation + "You're all set. Your picks are locked until you change them." Never a silent toast.
- **Mobile-first.** Dancers pick on phones, not laptops. School search is autofocus + instant filter. Ranking is drag-to-reorder AND tap-to-rank-up/down (drag alone isn't accessible enough).
- **Editable, not locked.** Spec doesn't mention locking; make selections editable until event end. A "Your picks" summary at the top always shows current state.
- **Profile edits never lose data.** Same autosave pattern as coach notes: save on blur + 2s idle; unsaved warning on navigate.
- **Photo upload mobile.** Use `<input type="file" accept="image/*" capture="user">` so phones offer camera directly.
- **Event profile vs canonical profile.** Dancers who already have S2S profiles should not be asked to re-enter data — the form pre-fills from `dancer_profiles` and edits update the canonical table. Only bio/extra live in `event_dancer_profiles`.

---

## File Map

**Backend create:**
- `apps/backend/app/database/schema/event_selections.ts`
- `apps/backend/app/modules/orgs/dancer/profile/{get,update}/*`
- `apps/backend/app/modules/orgs/dancer/selections/{upsert,get}/*`
- `apps/backend/app/modules/orgs/admin/selections/list/*`
- `apps/backend/app/modules/orgs/scouting/favorited-my-school/*` (coach-side boolean)
- `apps/backend/app/modules/orgs/dancer/routes.ts`

**Backend modify:**
- `apps/backend/app/database/schema/index.ts`
- `apps/backend/app/modules/orgs/routes.ts`
- `apps/backend/app/modules/orgs/scouting/dancers/get-by-id/service.ts` — fill in `favoritedMyRosterId` from Task 3 below

**Frontend create:**
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/dancer/index.tsx`
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/dancer/profile.tsx`
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/dancer/schools.tsx`
- `apps/frontend/src/features/org/components/school-picker.tsx`
- `apps/frontend/src/features/org/components/profile-form.tsx`
- `apps/frontend/src/features/org/components/privacy-notice.tsx`
- `apps/frontend/src/features/org/api/dancer-queries.ts`

---

## Task 1: Schema — `event_school_selections`

- [ ] **Step 1: Create the schema**

```typescript
// apps/backend/app/database/schema/event_selections.ts
import * as pg from "drizzle-orm/pg-core";
import { timestamps } from "./helpers/columns.ts";
import { orgEvents, eventRosters } from "./org_events.ts";

export const eventSchoolSelections = pg.pgTable(
  "event_school_selections",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg.uuid().notNull().references(() => orgEvents.id, { onDelete: "cascade" }),
    dancerRosterId: pg.uuid().notNull().references(() => eventRosters.id, { onDelete: "cascade" }),
    coachRosterId: pg.uuid().notNull().references(() => eventRosters.id, { onDelete: "cascade" }),
    rank: pg.smallint().notNull(),
    ...timestamps,
  },
  (table) => [
    pg.uniqueIndex().on(table.eventId, table.dancerRosterId, table.coachRosterId),
    pg.index().on(table.coachRosterId),
    pg.index().on(table.dancerRosterId),
  ]
);
```

- [ ] **Step 2: Barrel + migration + commit** (same drill as prior plans).

---

## Task 2: `PUT /orgs/:slug/school-selections` — dancer writes their picks

**Files:**
- Create: `apps/backend/app/modules/orgs/dancer/selections/upsert/*`
- Test: co-located

- [ ] **Step 1: Failing test**

```typescript
// Tests to include:
// - dancer can set N picks (N = org.settings.max_school_selections)
// - rank must be 1..N and unique
// - submitting more than max → 400
// - non-dancer rejected (403)
// - PUT replaces previous selections (atomic delete+insert in a tx)
```

- [ ] **Step 2: Validator**

```typescript
// apps/backend/app/modules/orgs/dancer/selections/upsert/validator.ts
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(vine.object({
  picks: vine.array(
    vine.object({
      coachRosterId: vine.string().uuid(),
      rank: vine.number().min(1).max(10),
    })
  ).minLength(1),
}));
export type Validator = Infer<typeof schema>;
```

- [ ] **Step 3: Service — replace-all in a transaction**

```typescript
// apps/backend/app/modules/orgs/dancer/selections/upsert/service.ts
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventSchoolSelections } from "#database/schema/event_selections";
import { eventRosters } from "#database/schema/org_events";
import { and, eq, inArray } from "drizzle-orm";
import type { Validator } from "./validator.ts";

@inject()
export class UpsertSelectionsService {
  constructor(private db: DatabaseService) {}

  async execute({
    eventId, dancerRosterId, max, picks,
  }: { eventId: string; dancerRosterId: string; max: number; picks: Validator["picks"]; }) {
    if (picks.length > max) throw new Error(`At most ${max} selections allowed`);
    const ranks = picks.map(p => p.rank);
    if (new Set(ranks).size !== ranks.length) throw new Error("Ranks must be unique");
    for (const r of ranks) if (r < 1 || r > max) throw new Error(`Rank out of range`);

    return this.db.tx(async (tx) => {
      // Verify all coachRosterIds belong to same event and are type=coach
      const ids = picks.map(p => p.coachRosterId);
      const coaches = await tx.select({ id: eventRosters.id, type: eventRosters.type, eventId: eventRosters.eventId })
        .from(eventRosters).where(inArray(eventRosters.id, ids));
      if (coaches.length !== ids.length || coaches.some(c => c.type !== "coach" || c.eventId !== eventId)) {
        throw new Error("Invalid coach selection");
      }

      await tx.delete(eventSchoolSelections)
        .where(and(
          eq(eventSchoolSelections.eventId, eventId),
          eq(eventSchoolSelections.dancerRosterId, dancerRosterId)
        ));

      await tx.insert(eventSchoolSelections).values(
        picks.map(p => ({
          eventId, dancerRosterId,
          coachRosterId: p.coachRosterId, rank: p.rank,
        }))
      );

      return tx.select().from(eventSchoolSelections)
        .where(and(
          eq(eventSchoolSelections.eventId, eventId),
          eq(eventSchoolSelections.dancerRosterId, dancerRosterId)
        ))
        .orderBy(eventSchoolSelections.rank);
    });
  }
}
```

- [ ] **Step 4: Controller reads `max_school_selections` from `ctx.org.settings`**

```typescript
// controller excerpt
const settings = ctx.org!.settings as { max_school_selections?: number };
const max = settings.max_school_selections ?? 3;
const result = await service.execute({
  eventId: ctx.orgEvent!.id,
  dancerRosterId: ctx.orgRoster!.id,
  max,
  picks: payload.picks,
});
return ctx.response.ok(result);
```

- [ ] **Step 5: Wire under the dancer routes**

```typescript
// apps/backend/app/modules/orgs/dancer/routes.ts
import router from "@adonisjs/core/services/router";
import { middleware } from "#start/kernel";

const UpsertSelections = () => import("./selections/upsert/controller.ts");

router.group(() => {
  router.put(":slug/school-selections", [UpsertSelections]);
  // get-selections, get-profile, update-profile added in later tasks
}).use([
  middleware.auth(), middleware.org(), middleware.orgEvent(),
  middleware.orgMember(), middleware.orgDancer(),
  middleware.orgFeature("school_selections"),
]).prefix("orgs");
```

Import from `apps/backend/app/modules/orgs/routes.ts`.

- [ ] **Step 6: Run tests + commit**

---

## Task 3: Coach boolean — wire `favoritedMyRosterId` in scouting

**Files:**
- Modify: `apps/backend/app/modules/orgs/scouting/dancers/get-by-id/service.ts`

Add a sub-select:

```typescript
const [selected] = await tx.select({ id: eventSchoolSelections.id })
  .from(eventSchoolSelections)
  .where(and(
    eq(eventSchoolSelections.eventId, eventId),
    eq(eventSchoolSelections.dancerRosterId, dancerRosterId),
    eq(eventSchoolSelections.coachRosterId, coachRosterId)
  ))
  .limit(1);
return { ...base, favoritedMySchool: !!selected };
```

The returned object never leaks `rank`, other coach ids, or counts. The response is strictly `favoritedMySchool: boolean`.

- [ ] **Test cases:**
  - Coach A's dancer profile view shows `favoritedMySchool: true` if the dancer picked coach A, else `false`.
  - Two coaches viewing the same dancer see different `favoritedMySchool` values (verify isolation).
  - The endpoint does NOT return `rank`, selection count, or any other coach id.

- [ ] **Run tests + commit**

---

## Task 4: Admin — `GET /orgs/:slug/school-selections`

Returns all selections for the active event with dancer + coach roster info JOINed. Admin only. Used by the admin dashboard to see who picked whom.

- [ ] **Standard TDD cycle + commit**

---

## Task 5: Dancer profile endpoints (`GET` + `PUT`)

**Files:**
- Create: `apps/backend/app/modules/orgs/dancer/profile/{get,update}/*`

`GET /orgs/:slug/profile` returns the merged shape for the current dancer:
- From `dancer_profiles` (canonical): firstName, lastName, avatar, gpa, gradYear, studio, state, height, danceStyles
- From `event_dancer_profiles`: bio, extra

`PUT /orgs/:slug/profile` accepts the same shape. Typed fields go to `dancer_profiles` (create if missing), bio/extra go to `event_dancer_profiles` (upsert).

- [ ] **Test cases:**
  - New S2S dancer (has `dancer_profiles`) gets pre-filled response
  - PUT updates canonical + event tables correctly
  - Bio-only update does not touch `dancer_profiles`

- [ ] **Implement, wire, run, commit**

---

## Task 6: Frontend — dancer queries

```typescript
// apps/frontend/src/features/org/api/dancer-queries.ts
import { $api } from "@/lib/api/client";

export const dancerQueries = {
  profile: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/profile", { params: { path: { slug } } }),
  selections: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/school-selections", { params: { path: { slug } } }),
  coaches: (slug: string) =>
    // Reuse the scouting list with a coach filter, OR create a dedicated
    // GET /orgs/:slug/coaches endpoint that returns {rosterId, schoolName, logoUrl}
    // for dancers to pick from. Dedicated endpoint is cleaner — add to Task 5 scope.
    $api.queryOptions("get", "/orgs/{slug}/coaches", { params: { path: { slug } } }),
};
```

Add the `GET /orgs/:slug/coaches` endpoint (member-gated, not coach-gated) that returns `{rosterId, organization, firstName, lastName, isRegistered}` for all coach rosters in the active event. This is what dancers pick from.

- [ ] **Steps:** implement endpoint, write query, commit.

---

## Task 7: Frontend — privacy notice + school picker component

**Files:**
- Create: `apps/frontend/src/features/org/components/privacy-notice.tsx`
- Create: `apps/frontend/src/features/org/components/school-picker.tsx`

```tsx
// apps/frontend/src/features/org/components/privacy-notice.tsx
import { Lock } from "lucide-react";

export function PrivacyNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/15 bg-white/5 p-4">
      <Lock className="size-5 shrink-0 opacity-80" />
      <p className="text-sm leading-relaxed opacity-90">{children}</p>
    </div>
  );
}
```

```tsx
// apps/frontend/src/features/org/components/school-picker.tsx
import { useMemo, useState } from "react";
import { useOrg } from "@/features/org/context/use-org";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface Pick { coachRosterId: string; rank: number; organization: string; }

export function SchoolPicker({
  coaches, initial, onChange, onSave, saving,
}: {
  coaches: Array<{ rosterId: string; organization: string; isRegistered: boolean }>;
  initial: Pick[];
  onChange: (picks: Pick[]) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const { settings } = useOrg();
  const max = (settings.max_school_selections as number | undefined) ?? 3;
  const [picks, setPicks] = useState<Pick[]>(initial);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() =>
    coaches.filter(c => c.organization.toLowerCase().includes(query.toLowerCase())),
    [coaches, query]);

  function addPick(c: { rosterId: string; organization: string }) {
    if (picks.some(p => p.coachRosterId === c.rosterId)) return;
    if (picks.length >= max) return;
    const next = [...picks, { coachRosterId: c.rosterId, organization: c.organization, rank: picks.length + 1 }];
    setPicks(next); onChange(next);
  }
  function movePick(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= picks.length) return;
    const next = [...picks];
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    next.forEach((p, i) => (p.rank = i + 1));
    setPicks(next); onChange(next);
  }
  function removePick(idx: number) {
    const next = picks.filter((_, i) => i !== idx).map((p, i) => ({ ...p, rank: i + 1 }));
    setPicks(next); onChange(next);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Your picks ({picks.length}/{max})</h2>
        {picks.length === 0 && <p className="opacity-60 text-sm">No picks yet. Tap a school below to add it.</p>}
        <ol className="space-y-2">
          {picks.map((p, i) => (
            <li key={p.coachRosterId}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="text-lg font-bold">#{i + 1}</span>
              <span className="flex-1 truncate">{p.organization}</span>
              <button onClick={() => movePick(i, -1)} className="size-10 rounded-full" aria-label="Move up">▲</button>
              <button onClick={() => movePick(i, 1)} className="size-10 rounded-full" aria-label="Move down">▼</button>
              <button onClick={() => removePick(i)} className="size-10 rounded-full text-red-300" aria-label="Remove">✕</button>
            </li>
          ))}
        </ol>
      </div>

      <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder="Search schools…" className="h-12 text-base" inputMode="search" />

      <ul className="space-y-2">
        {filtered.map((c) => {
          const chosen = picks.some(p => p.coachRosterId === c.rosterId);
          return (
            <li key={c.rosterId}>
              <button
                onClick={() => addPick(c)}
                disabled={chosen || picks.length >= max}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-left disabled:opacity-40"
              >
                <span>{c.organization}</span>
                <span className="text-sm">{chosen ? "Added" : picks.length >= max ? "Max reached" : "Add"}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <Button
        onClick={onSave}
        disabled={saving || picks.length === 0}
        className="h-12 w-full text-base font-semibold"
        style={{ background: "var(--org-accent)", color: "white" }}
      >
        {saving ? "Saving…" : "Save picks"}
      </Button>
    </div>
  );
}
```

- [ ] **Build + commit**

---

## Task 8: Frontend — `schools.tsx` route with peak-moment confirmation

```tsx
// apps/frontend/src/routes/_org/$orgSlug/_authenticated/dancer/schools.tsx
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { $api } from "@/lib/api/client";
import { dancerQueries } from "@/features/org/api/dancer-queries";
import { SchoolPicker, type Pick } from "@/features/org/components/school-picker";
import { PrivacyNotice } from "@/features/org/components/privacy-notice";
import { useState } from "react";

export const Route = createFileRoute("/_org/$orgSlug/_authenticated/dancer/schools")({
  component: SchoolsPage,
});

function SchoolsPage() {
  const { orgSlug } = useParams({ from: "/_org/$orgSlug/_authenticated/dancer/schools" });
  const { data: coaches } = useSuspenseQuery(dancerQueries.coaches(orgSlug));
  const { data: current } = useSuspenseQuery(dancerQueries.selections(orgSlug));
  const [picks, setPicks] = useState<Pick[]>(
    current.map((s: any) => ({
      coachRosterId: s.coachRosterId, rank: s.rank,
      organization: coaches.find((c: any) => c.rosterId === s.coachRosterId)?.organization ?? "",
    }))
  );
  const [justSaved, setJustSaved] = useState(false);
  const save = $api.useMutation("put", "/orgs/{slug}/school-selections", {
    onSuccess: () => {
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
      navigator.vibrate?.([30, 20, 30]);
    },
  });

  return (
    <main className="mx-auto max-w-lg space-y-6 p-5 text-white">
      <h1 className="text-2xl font-bold">Your top schools</h1>
      <PrivacyNotice>
        Only you and event organizers can see your picks. Coaches will only
        see <strong>whether</strong> you picked their school — never your ranking
        or your other choices.
      </PrivacyNotice>

      <SchoolPicker
        coaches={coaches}
        initial={picks}
        onChange={setPicks}
        saving={save.isPending}
        onSave={() =>
          save.mutate({
            params: { path: { slug: orgSlug } },
            body: { picks: picks.map(({ coachRosterId, rank }) => ({ coachRosterId, rank })) },
          })
        }
      />

      {justSaved && (
        <div
          className="fixed inset-x-0 bottom-6 mx-auto w-fit rounded-full px-6 py-3 text-sm font-semibold shadow-lg"
          style={{ background: "var(--org-accent)" }}
        >
          You're all set. Picks saved.
        </div>
      )}
    </main>
  );
}
```

- [ ] **Build + commit**

---

## Task 9: Frontend — profile edit page with autosave

**Files:**
- Create: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/dancer/profile.tsx`
- Create: `apps/frontend/src/features/org/components/profile-form.tsx`

The profile form mirrors the notes-editor autosave pattern from Plan 04. Fields: firstName, lastName, photo, gpa, gradYear, studio, state, height, danceStyles (multi-select), bio. Save triggers on blur + 2s idle.

- [ ] **Steps:** implement → build → commit.

---

## Task 10: Verification

- [ ] Full backend tests pass.
- [ ] Frontend build clean.
- [ ] Manual: log in as two dancer accounts. Each picks a different set of schools. Log in as coach A — verify their dancer profile views show `favoritedMySchool: true` only for dancers who picked them. Log in as coach B — different boolean outcomes. NEVER see other coaches' selections.
- [ ] Manual: submit picks → see the confirmation bubble + haptic.
- [ ] Manual: edit profile, navigate away without saving → see unsaved-warning prompt.
- [ ] Manual: as a Summit admin, hit `/orgs/summit/school-selections` → see all selections with ranks.

---

## Definition of Done

- Dancers can set/edit their top N school picks; `N` sourced from `org.settings.max_school_selections`.
- Coach API exposes only a boolean per dancer, never rank or counts.
- Admin API exposes full selection data for aggregate views.
- Dancer profile edits autosave and write to the correct table(s).
- All tests pass; two-coach isolation verified.
