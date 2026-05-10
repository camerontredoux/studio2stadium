# Summit Plan 04 — Coach Scouting (Favorites, Notes, Ratings, Search)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Let coaches find, favorite, rate, and take notes on dancers during a live event. All coach-scoped data is strictly isolated per coach via server-resolved `coach_roster_id`.

**Architecture:** Three tables (`event_favorites`, `event_notes`, `event_ratings`) all keyed by `(event_id, coach_roster_id, dancer_roster_id)`. `coach_roster_id` is never accepted from the client — it comes from `ctx.orgRoster` resolved by the `orgEvent` middleware. Endpoints live under `/orgs/:slug/*`. Coach UI is mobile-first with instant favorite, autosaved notes, and tap-dot rating.

**Tech Stack:** Adonis 6, Drizzle, VineJS, TanStack Query (optimistic updates), shadcn/ui, React 19.

**Source spec sections:** 3 (event_favorites, event_notes, event_ratings), 4 (coach routes), 5 (coach frontend).

**Depends on:** Plans 01, 02, 03.

---

## UX Concerns Folded In

- **Mobile-first.** Everything is designed for one-thumb operation. Favorite and rating are single-tap. Notes are a single textarea with autosave on blur and on a 2s idle timer. Touch targets ≥44px.
- **Live-venue offline resilience.** Favorites and ratings use optimistic mutations with retry. If the device loses Wi-Fi mid-event, the UI updates immediately and the mutation queues.
- **Bib-number quick-jump.** The dancer search bar detects a numeric-only query and jumps directly to the dancer profile if exactly one match, instead of showing a list.
- **Coach data isolation is a security property, not a UI concern.** Every query filters by `ctx.orgRoster.id`. The client never passes it.
- **Rating UX: tap dots, not sliders.** A 1–10 rating renders as 10 dots; tap a dot to set. Haptic feedback via `navigator.vibrate(10)` on supported devices.
- **Notes never lose data.** Autosave on blur + every 2s of idle. `beforeunload` listener warns on unsaved dirty state. Save state visible as a tiny "Saved" indicator.
- **Pending-registration coaches appear muted.** Rosters surfaced to other coaches show unregistered schools with reduced opacity and a "pending" pill.
- **Rankings view is a peak moment.** End of event, the coach views their ranked dancers and can export notes. Design this as a celebration state, not a spreadsheet.

---

## File Map

**Backend create:**
- `apps/backend/app/database/schema/event_features.ts` — `eventFavorites`, `eventNotes`, `eventRatings`
- `apps/backend/app/modules/orgs/scouting/dancers/{list,get-by-id}/*`
- `apps/backend/app/modules/orgs/scouting/favorites/{create,delete,list}/*`
- `apps/backend/app/modules/orgs/scouting/notes/{upsert,delete}/*`
- `apps/backend/app/modules/orgs/scouting/ratings/upsert/*`
- `apps/backend/app/modules/orgs/scouting/rankings/*`
- `apps/backend/app/modules/orgs/scouting/routes.ts`
- Tests co-located.

**Backend modify:**
- `apps/backend/app/database/schema/index.ts`
- `apps/backend/app/modules/orgs/routes.ts` — mount scouting routes

**Frontend create:**
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/index.tsx`
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx`
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/$dancerId.tsx`
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/favorites.tsx`
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/rankings.tsx`
- `apps/frontend/src/features/org/components/dancer-card.tsx`
- `apps/frontend/src/features/org/components/dancer-profile.tsx`
- `apps/frontend/src/features/org/components/favorite-button.tsx`
- `apps/frontend/src/features/org/components/rating-input.tsx`
- `apps/frontend/src/features/org/components/notes-editor.tsx`
- `apps/frontend/src/features/org/api/scouting-queries.ts`
- `apps/frontend/src/features/org/hooks/use-bib-quick-jump.ts`

---

## Task 1: Schema — `event_favorites`, `event_notes`, `event_ratings`

**Files:**
- Create: `apps/backend/app/database/schema/event_features.ts`
- Modify: `apps/backend/app/database/schema/index.ts`

- [ ] **Step 1: Create the schema file**

```typescript
// apps/backend/app/database/schema/event_features.ts
import * as pg from "drizzle-orm/pg-core";
import { timestamps } from "./helpers/columns.ts";
import { orgEvents, eventRosters } from "./org_events.ts";

export const eventFavorites = pg.pgTable(
  "event_favorites",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg.uuid().notNull().references(() => orgEvents.id, { onDelete: "cascade" }),
    coachRosterId: pg.uuid().notNull().references(() => eventRosters.id, { onDelete: "cascade" }),
    dancerRosterId: pg.uuid().notNull().references(() => eventRosters.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    pg.uniqueIndex().on(table.eventId, table.coachRosterId, table.dancerRosterId),
    pg.index().on(table.coachRosterId),
  ]
);

export const eventNotes = pg.pgTable(
  "event_notes",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg.uuid().notNull().references(() => orgEvents.id, { onDelete: "cascade" }),
    coachRosterId: pg.uuid().notNull().references(() => eventRosters.id, { onDelete: "cascade" }),
    dancerRosterId: pg.uuid().notNull().references(() => eventRosters.id, { onDelete: "cascade" }),
    content: pg.text().notNull(),
    ...timestamps,
  },
  (table) => [
    pg.uniqueIndex().on(table.eventId, table.coachRosterId, table.dancerRosterId),
    pg.index().on(table.coachRosterId),
  ]
);

export const eventRatings = pg.pgTable(
  "event_ratings",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg.uuid().notNull().references(() => orgEvents.id, { onDelete: "cascade" }),
    coachRosterId: pg.uuid().notNull().references(() => eventRosters.id, { onDelete: "cascade" }),
    dancerRosterId: pg.uuid().notNull().references(() => eventRosters.id, { onDelete: "cascade" }),
    rating: pg.smallint().notNull(),
    ...timestamps,
  },
  (table) => [
    pg.uniqueIndex().on(table.eventId, table.coachRosterId, table.dancerRosterId),
    pg.index().on(table.coachRosterId),
  ]
);
```

- [ ] **Step 2: Barrel-export**

Add `export * from "./event_features.ts";` to `index.ts`.

- [ ] **Step 3: Generate + apply migration**

```bash
pnpm --filter backend db:generate
pnpm --filter backend db:migrate
```

- [ ] **Step 4: Typecheck + commit**

```bash
pnpm --filter backend typecheck
git add apps/backend/app/database
git commit -m "feat(db): event_favorites, event_notes, event_ratings"
```

---

## Task 2: `GET /orgs/:slug/dancers` — search + filter

**Files:**
- Create: `apps/backend/app/modules/orgs/scouting/dancers/list/{validator,service,controller}.ts`
- Test: `apps/backend/app/modules/orgs/scouting/dancers/list/service.test.ts`
- Create: `apps/backend/app/modules/orgs/scouting/routes.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/backend/app/modules/orgs/scouting/dancers/list/service.test.ts
import { test } from "@japa/runner";

test.group("GET /orgs/:slug/dancers", () => {
  test("returns dancers for active event filtered by search string", async ({ client, assert }) => {
    // Setup: org, event, coach, roster rows with varied names + bibs
    // Call endpoint with ?search=Al — expect only rows matching name
    // Call endpoint with ?bib=101 — expect exact bib match
    // Assert non-coach users get 403
  });

  test("bib filter returns exact match only", async ({ client }) => { /* ... */ });

  test("unregistered rosters are included with is_registered=false", async ({ client }) => { /* ... */ });
});
```

- [ ] **Step 2: Run to verify failure**

- [ ] **Step 3: Validator**

```typescript
// apps/backend/app/modules/orgs/scouting/dancers/list/validator.ts
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(vine.object({
  search: vine.string().trim().minLength(1).optional(),
  bib: vine.number().positive().optional(),
  limit: vine.number().min(1).max(200).optional(),
  offset: vine.number().min(0).optional(),
}));
export type Validator = Infer<typeof schema>;
```

- [ ] **Step 4: Service — JOIN dancer_profiles for source-of-truth fields**

```typescript
// apps/backend/app/modules/orgs/scouting/dancers/list/service.ts
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters, eventDancerProfiles } from "#database/schema/org_events";
import { dancerProfiles } from "#database/schema/dancers";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import type { Validator } from "./validator.ts";

@inject()
export class ListDancersService {
  constructor(private db: DatabaseService) {}

  async execute(eventId: string, q: Validator) {
    return this.db.use((db) => {
      let where = and(
        eq(eventRosters.eventId, eventId),
        eq(eventRosters.type, "dancer")
      );

      if (q.bib) {
        where = and(where, eq(eventRosters.bibNumber, q.bib));
      } else if (q.search) {
        const pattern = `%${q.search}%`;
        where = and(
          where,
          or(
            ilike(eventRosters.firstName, pattern),
            ilike(eventRosters.lastName, pattern),
            ilike(eventRosters.organization, pattern),
            sql`(${dancerProfiles.firstName} || ' ' || ${dancerProfiles.lastName}) ILIKE ${pattern}`
          )
        );
      }

      return db
        .select({
          rosterId: eventRosters.id,
          bibNumber: eventRosters.bibNumber,
          firstName: sql<string>`COALESCE(${dancerProfiles.firstName}, ${eventRosters.firstName})`,
          lastName: sql<string>`COALESCE(${dancerProfiles.lastName}, ${eventRosters.lastName})`,
          profilePhotoUrl: dancerProfiles.avatar,
          gpa: dancerProfiles.gpa,
          gradYear: dancerProfiles.gradYear,
          studio: dancerProfiles.studio,
          state: dancerProfiles.state,
          isRegistered: eventRosters.isRegistered,
        })
        .from(eventRosters)
        .leftJoin(dancerProfiles, eq(dancerProfiles.userId, eventRosters.userId))
        .leftJoin(eventDancerProfiles, eq(eventDancerProfiles.rosterId, eventRosters.id))
        .where(where)
        .orderBy(eventRosters.bibNumber)
        .limit(q.limit ?? 100)
        .offset(q.offset ?? 0);
    });
  }
}
```

*(Adjust column references to match the actual `dancerProfiles` schema in `apps/backend/app/database/schema/dancers.ts`.)*

- [ ] **Step 5: Controller**

```typescript
// apps/backend/app/modules/orgs/scouting/dancers/list/controller.ts
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListDancersService } from "./service.ts";
import { schema } from "./validator.ts";

export default class ListDancersController {
  @inject()
  async handle(ctx: HttpContext, service: ListDancersService) {
    const payload = await ctx.request.validateUsing(schema);
    const rows = await service.execute(ctx.orgEvent!.id, payload);
    return ctx.response.ok(rows);
  }
}
```

- [ ] **Step 6: Routes**

```typescript
// apps/backend/app/modules/orgs/scouting/routes.ts
import router from "@adonisjs/core/services/router";
import { middleware } from "#start/kernel";

const ListDancers = () => import("./dancers/list/controller.ts");
// ... import other controllers as created in later tasks

router.group(() => {
  router.get(":slug/dancers", [ListDancers]);
}).use([
  middleware.auth(), middleware.org(), middleware.orgEvent(),
  middleware.orgMember(), middleware.orgCoach(),
]).prefix("orgs").openapi({ tags: ["Org Scouting"] });
```

Import from `apps/backend/app/modules/orgs/routes.ts`:
```typescript
import "./scouting/routes.ts";
```

- [ ] **Step 7: Run tests + commit**

---

## Task 3: `GET /orgs/:slug/dancers/:id` — full dancer profile

**Files:**
- Create: `apps/backend/app/modules/orgs/scouting/dancers/get-by-id/{service,controller}.ts`
- Test: co-located

The service returns:
- Core dancer data (JOINed from `dancer_profiles` with fallback to `event_rosters` CSV data)
- `event_dancer_profiles.bio` / `extra`
- The requesting coach's note (filtered by `ctx.orgRoster.id`)
- The requesting coach's rating
- Whether the requesting coach has favorited
- The school selection boolean `favoritedMyRosterId: true|false` (Plan 5 wires this; stub to `null` for now)

- [ ] **Step 1–7: Write test → implement validator/service/controller → wire route → run tests → commit**

---

## Task 4: Favorites endpoints (`POST`, `DELETE`, `GET`)

**Files:**
- Create: `apps/backend/app/modules/orgs/scouting/favorites/{create,delete,list}/*`
- Test: co-located

Key rules:
- `POST /orgs/:slug/favorites` body: `{ dancerRosterId }`. Server uses `ctx.orgRoster.id` as coach id.
- Unique constraint prevents duplicates; return 200 if already favorited (idempotent).
- `DELETE /orgs/:slug/favorites/:dancerRosterId` — uses dancer roster id, not favorite id, so the client doesn't need to track the favorite row.
- `GET /orgs/:slug/favorites` — returns the coach's favorites with dancer profile JOIN.

- [ ] **Tasks 4.1–4.3 follow the standard TDD pattern: test → impl → wire → run → commit**

---

## Task 5: Notes — upsert + delete

**Files:**
- Create: `apps/backend/app/modules/orgs/scouting/notes/{upsert,delete}/*`
- Test: co-located

Notes are a 1:1 per `(coach, dancer)` relationship. `PUT /orgs/:slug/dancers/:dancerRosterId/notes` body `{ content }` — upsert semantics, update if exists. `DELETE` removes the row.

- [ ] **Steps:** test (empty content rejected, long content accepted, upsert replaces, coach can only see own note) → impl → run → commit.

---

## Task 6: Ratings — upsert

**Files:**
- Create: `apps/backend/app/modules/orgs/scouting/ratings/upsert/*`

Validator clamps `rating` to `1..org.settings.rating_scale_max`. Use `ctx.org.settings` at runtime to enforce.

```typescript
// apps/backend/app/modules/orgs/scouting/ratings/upsert/service.ts
// Inside execute:
const settings = org.settings as { rating_scale_max?: number };
const max = settings.rating_scale_max ?? 10;
if (input.rating < 1 || input.rating > max) {
  throw new Error(`Rating must be between 1 and ${max}`);
}
```

- [ ] **Steps:** test (valid rating persists, invalid rejected, update existing) → impl → run → commit.

---

## Task 7: Rankings — `GET /orgs/:slug/rankings`

Returns the coach's favorited + rated dancers, ordered by `rating DESC NULLS LAST, favorited_at DESC`. Includes dancer profile data via the same JOIN pattern.

- [ ] **Steps:** test → impl → wire → run → commit.

---

## Task 8: Frontend — scouting queries + bib quick-jump hook

**Files:**
- Create: `apps/frontend/src/features/org/api/scouting-queries.ts`
- Create: `apps/frontend/src/features/org/hooks/use-bib-quick-jump.ts`

```typescript
// apps/frontend/src/features/org/api/scouting-queries.ts
import { $api } from "@/lib/api/client";

export const scoutingQueries = {
  dancers: (slug: string, params: { search?: string; bib?: number }) =>
    $api.queryOptions("get", "/orgs/{slug}/dancers", {
      params: { path: { slug }, query: params },
    }),
  dancer: (slug: string, id: string) =>
    $api.queryOptions("get", "/orgs/{slug}/dancers/{id}", {
      params: { path: { slug, id } },
    }),
  favorites: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/favorites", { params: { path: { slug } } }),
  rankings: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/rankings", { params: { path: { slug } } }),
};
```

```typescript
// apps/frontend/src/features/org/hooks/use-bib-quick-jump.ts
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { scoutingQueries } from "@/features/org/api/scouting-queries";

export function useBibQuickJump(slug: string) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async (query: string) => {
    if (!/^\d+$/.test(query)) return false;
    const data = await qc.fetchQuery(
      scoutingQueries.dancers(slug, { bib: Number(query) })
    );
    if (data.length === 1) {
      await navigate({
        to: "/$orgSlug/coach/dancers/$dancerId",
        params: { orgSlug: slug, dancerId: data[0]!.rosterId },
      });
      return true;
    }
    return false;
  };
}
```

- [ ] **Steps:** create files → build → commit.

---

## Task 9: Frontend — dancer search page with optimistic favorites

**Files:**
- Create: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx`
- Create: `apps/frontend/src/features/org/components/dancer-card.tsx`
- Create: `apps/frontend/src/features/org/components/favorite-button.tsx`

```tsx
// apps/frontend/src/features/org/components/favorite-button.tsx
import { $api } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { Heart } from "lucide-react";
import { useOrg } from "@/features/org/context/use-org";

export function FavoriteButton({
  dancerRosterId, isFavorited,
}: { dancerRosterId: string; isFavorited: boolean }) {
  const { org } = useOrg();
  const qc = useQueryClient();
  const add = $api.useMutation("post", "/orgs/{slug}/favorites");
  const remove = $api.useMutation("delete", "/orgs/{slug}/favorites/{dancerRosterId}");

  const toggle = async () => {
    navigator.vibrate?.(10);
    const optimistic = !isFavorited;
    qc.setQueryData(scoutingQueries.dancer(org.slug, dancerRosterId).queryKey,
      (old: any) => (old ? { ...old, isFavorited: optimistic } : old));
    try {
      if (isFavorited) {
        await remove.mutateAsync({
          params: { path: { slug: org.slug, dancerRosterId } },
        });
      } else {
        await add.mutateAsync({
          params: { path: { slug: org.slug } },
          body: { dancerRosterId },
        });
      }
      qc.invalidateQueries({ queryKey: scoutingQueries.favorites(org.slug).queryKey });
    } catch {
      qc.setQueryData(scoutingQueries.dancer(org.slug, dancerRosterId).queryKey,
        (old: any) => (old ? { ...old, isFavorited } : old));
    }
  };

  return (
    <button
      onClick={toggle}
      className="flex size-11 items-center justify-center rounded-full"
      aria-label={isFavorited ? "Unfavorite" : "Favorite"}
    >
      <Heart
        className="size-6"
        fill={isFavorited ? "var(--org-accent, #e94560)" : "none"}
        stroke={isFavorited ? "var(--org-accent, #e94560)" : "currentColor"}
      />
    </button>
  );
}
```

```tsx
// apps/frontend/src/features/org/components/dancer-card.tsx
import { Link } from "@tanstack/react-router";
import { FavoriteButton } from "./favorite-button";

export function DancerCard({ dancer, slug }: { dancer: any; slug: string }) {
  return (
    <Link
      to="/$orgSlug/coach/dancers/$dancerId"
      params={{ orgSlug: slug, dancerId: dancer.rosterId }}
      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 active:bg-white/10"
    >
      <div className="size-16 overflow-hidden rounded-full bg-white/10">
        {dancer.profilePhotoUrl && (
          <img src={dancer.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">#{dancer.bibNumber}</span>
          <span className="truncate">{dancer.firstName} {dancer.lastName}</span>
        </div>
        <div className="text-sm opacity-70">
          {dancer.studio ?? ""} {dancer.state ? `· ${dancer.state}` : ""}
        </div>
      </div>
      <FavoriteButton dancerRosterId={dancer.rosterId} isFavorited={dancer.isFavorited} />
    </Link>
  );
}
```

```tsx
// apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useDeferredValue, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { DancerCard } from "@/features/org/components/dancer-card";
import { useBibQuickJump } from "@/features/org/hooks/use-bib-quick-jump";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_org/$orgSlug/_authenticated/coach/dancers/")({
  component: DancerSearch,
});

function DancerSearch() {
  const { orgSlug } = useParams({ from: "/_org/$orgSlug/_authenticated/coach/dancers/" });
  const [search, setSearch] = useState("");
  const deferred = useDeferredValue(search);
  const { data } = useSuspenseQuery(
    scoutingQueries.dancers(orgSlug, { search: deferred || undefined })
  );
  const quickJump = useBibQuickJump(orgSlug);

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4 text-white">
      <Input
        autoFocus value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            const jumped = await quickJump(search);
            if (jumped) setSearch("");
          }
        }}
        placeholder="Search name or bib…"
        className="h-12 text-base"
        inputMode="search"
      />
      <div className="space-y-3">
        {data.length === 0 && <EmptyState search={deferred} />}
        {data.map((d) => (
          <DancerCard key={d.rosterId} dancer={d} slug={orgSlug} />
        ))}
      </div>
    </main>
  );
}

function EmptyState({ search }: { search: string }) {
  if (!search) return <p className="opacity-70">Type to search dancers.</p>;
  return <p className="opacity-70">No dancers matched "{search}".</p>;
}
```

- [ ] **Steps:** implement files → build → smoke test → commit.

---

## Task 10: Frontend — dancer profile with notes autosave + rating

**Files:**
- Create: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/$dancerId.tsx`
- Create: `apps/frontend/src/features/org/components/notes-editor.tsx`
- Create: `apps/frontend/src/features/org/components/rating-input.tsx`

```tsx
// apps/frontend/src/features/org/components/rating-input.tsx
export function RatingInput({ value, max, onChange }: { value: number | null; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
        const active = value !== null && value >= n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onClick={() => { navigator.vibrate?.(10); onChange(n); }}
            className="size-11 rounded-full"
          >
            <span
              className="block size-6 rounded-full"
              style={{
                background: active ? "var(--org-accent)" : "rgba(255,255,255,0.2)",
                margin: "0 auto",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
```

```tsx
// apps/frontend/src/features/org/components/notes-editor.tsx
import { useEffect, useRef, useState } from "react";
import { $api } from "@/lib/api/client";
import { useOrg } from "@/features/org/context/use-org";

export function NotesEditor({ dancerRosterId, initial }: { dancerRosterId: string; initial: string | null }) {
  const { org } = useOrg();
  const [content, setContent] = useState(initial ?? "");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = content !== (initial ?? "");

  const upsert = $api.useMutation("put", "/orgs/{slug}/dancers/{dancerRosterId}/notes");

  async function save() {
    if (!dirty) return;
    setSaving(true);
    try {
      await upsert.mutateAsync({
        params: { path: { slug: org.slug, dancerRosterId } },
        body: { content },
      });
      setSavedAt(new Date());
    } finally { setSaving(false); }
  }

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (dirty) timer.current = setTimeout(save, 2000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [content]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  return (
    <div className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={save}
        placeholder="Your private notes on this dancer…"
        className="min-h-32 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-base"
      />
      <div className="text-xs opacity-60">
        {saving ? "Saving…" : dirty ? "Unsaved changes" : savedAt ? `Saved ${savedAt.toLocaleTimeString()}` : ""}
      </div>
    </div>
  );
}
```

- [ ] **Steps:** implement → build → commit.

---

## Task 11: Frontend — rankings view (end-of-event peak moment)

Designed as a celebratory summary: total count of favorited dancers, a ranked list with inline ratings, and a "Copy notes to clipboard" action. No CSV export (YAGNI for this release).

- [ ] **Steps:** implement → commit.

---

## Task 12: Verification

- [ ] Full backend tests pass.
- [ ] Frontend build clean.
- [ ] Manual: log in as a Summit coach (seeded via a test fixture), favorite a dancer, verify optimistic UI; type notes, verify autosave; rate 1-10, verify persistence.
- [ ] Manual: type a bib number in the search bar and press Enter → expect quick-jump to the dancer profile.
- [ ] Manual: log in as a different coach and verify their view contains NONE of the first coach's notes/ratings/favorites (data isolation).

---

## Definition of Done

- Coach can search dancers by name or bib with quick-jump on exact-match bib.
- Coach can favorite, rate, and take notes; all scoped to their own roster id.
- Notes autosave and recover from navigation.
- Rankings view shows the coach's personal ranked list.
- Data isolation verified across two coach accounts.
- All tests pass.
