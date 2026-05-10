# Summit Plan 06 — Video Library

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Give each event a library of YouTube videos that admins manage, all participants can watch, and (optionally, feature-gated) can be assigned to specific coaches or dancers.

**Architecture:** Two tables. `event_videos` holds the YouTube link, title, description, thumbnail, sort order. `event_video_assignments` is feature-gated — when `video_coach_assignment` or `video_dancer_assignment` is on, admins assign videos to specific rosters and participants only see assigned videos. When off, everyone sees everything.

**Tech Stack:** Adonis 6, Drizzle, VineJS, React 19.

**Source spec sections:** 3 (event_videos, event_video_assignments), 4 (video route), 5 (video UI).

**Depends on:** Plans 01, 02, 03.

---

## UX Concerns Folded In

- **Thumbnail URL auto-derived from YouTube URL on insert.** Don't make admins paste a thumbnail URL separately — extract the video ID and derive `https://img.youtube.com/vi/{id}/hqdefault.jpg`.
- **Mobile-first grid.** 2-column card grid on phones, expanding to 3-4 on tablet/desktop. Cards are tap-to-play; use YouTube iframe embed inside a modal rather than navigating away.
- **Feature gating is invisible.** When `video_library: false`, the video route 404s and the nav item is absent from the frontend. When assignment features are off, the assignment UI in the admin page is absent.
- **Admin reorder is drag-to-reorder on desktop, up/down buttons on mobile.** Don't force admins into any one mode.
- **Empty state.** Fresh event with no videos — admin sees a prompt to paste a YouTube URL; participants see "No videos yet" with a subtle illustration.
- **Offline hint.** Tapping a video at the venue with spotty Wi-Fi should surface a "You're offline — try again" banner instead of a broken iframe.

---

## File Map

**Backend create:**
- `apps/backend/app/database/schema/event_videos.ts`
- `apps/backend/app/modules/orgs/videos/{list,create,update,delete,reorder}/*`
- `apps/backend/app/modules/orgs/videos/assignments/{create,delete,list}/*` (feature-gated)
- `apps/backend/app/modules/orgs/videos/routes.ts`
- `apps/backend/app/shared/org/youtube.ts` — URL parser helper

**Backend modify:**
- `apps/backend/app/database/schema/index.ts`
- `apps/backend/app/modules/orgs/routes.ts`

**Frontend create:**
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/videos.tsx`
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/videos.tsx` (or shared)
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/dancer/videos.tsx`
- `apps/frontend/src/features/org/components/video-card.tsx`
- `apps/frontend/src/features/org/components/video-modal.tsx`
- `apps/frontend/src/features/org/api/video-queries.ts`

---

## Task 1: Schema

- [ ] **Step 1: Create schema file**

```typescript
// apps/backend/app/database/schema/event_videos.ts
import * as pg from "drizzle-orm/pg-core";
import { timestamps } from "./helpers/columns.ts";
import { orgEvents, eventRosters } from "./org_events.ts";
import { users } from "./users.ts";

export const eventVideos = pg.pgTable(
  "event_videos",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg.uuid().notNull().references(() => orgEvents.id, { onDelete: "cascade" }),
    title: pg.text().notNull(),
    description: pg.text(),
    youtubeUrl: pg.text().notNull(),
    youtubeId: pg.varchar({ length: 16 }).notNull(),
    thumbnailUrl: pg.text(),
    sortOrder: pg.integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.eventId, table.sortOrder),
  ]
);

export const eventVideoAssignments = pg.pgTable(
  "event_video_assignments",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    videoId: pg.uuid().notNull().references(() => eventVideos.id, { onDelete: "cascade" }),
    rosterId: pg.uuid().notNull().references(() => eventRosters.id, { onDelete: "cascade" }),
    assignedBy: pg.uuid().notNull().references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    pg.uniqueIndex().on(table.videoId, table.rosterId),
    pg.index().on(table.rosterId),
  ]
);
```

- [ ] **Step 2: Barrel + migration + commit**

---

## Task 2: YouTube URL helper

**Files:**
- Create: `apps/backend/app/shared/org/youtube.ts`
- Test: co-located

- [ ] **Step 1: Failing test**

```typescript
// apps/backend/app/shared/org/youtube.test.ts
import { test } from "@japa/runner";
import { parseYouTubeUrl } from "./youtube.ts";

test.group("parseYouTubeUrl", () => {
  test("extracts id from watch?v=", ({ assert }) => {
    assert.equal(parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  });
  test("extracts id from youtu.be short link", ({ assert }) => {
    assert.equal(parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  });
  test("extracts id from /embed/", ({ assert }) => {
    assert.equal(parseYouTubeUrl("https://www.youtube.com/embed/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  });
  test("returns null for non-youtube urls", ({ assert }) => {
    assert.isNull(parseYouTubeUrl("https://vimeo.com/12345"));
  });
});
```

- [ ] **Step 2: Implement**

```typescript
// apps/backend/app/shared/org/youtube.ts
const patterns = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
];

export function parseYouTubeUrl(url: string): string | null {
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1] ?? null;
  }
  return null;
}

export function thumbnailUrlFor(id: string) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}
```

- [ ] **Step 3: Run tests + commit**

---

## Task 3: Admin video CRUD

**Files:**
- Create: `apps/backend/app/modules/orgs/videos/{create,update,delete,list,reorder}/*`
- Create: `apps/backend/app/modules/orgs/videos/routes.ts`

- [ ] **Step 1: Failing test for `POST /orgs/:slug/videos` — creates row, derives youtubeId + thumbnail**

```typescript
// apps/backend/app/modules/orgs/videos/create/service.test.ts
// Cases:
// - valid URL → creates row with extracted id + derived thumbnail
// - invalid URL → 400
// - non-admin member → 403
// - non-member → 403
// - if org.features.video_library is false → 404 on the route entirely
```

- [ ] **Step 2: Validator**

```typescript
// apps/backend/app/modules/orgs/videos/create/validator.ts
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(vine.object({
  title: vine.string().trim().minLength(1).maxLength(160),
  description: vine.string().trim().optional(),
  youtubeUrl: vine.string().url(),
}));
export type Validator = Infer<typeof schema>;
```

- [ ] **Step 3: Service**

```typescript
// apps/backend/app/modules/orgs/videos/create/service.ts
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventVideos } from "#database/schema/event_videos";
import { parseYouTubeUrl, thumbnailUrlFor } from "#shared/org/youtube";
import { max as dmax, eq } from "drizzle-orm";
import type { Validator } from "./validator.ts";

@inject()
export class CreateVideoService {
  constructor(private db: DatabaseService) {}

  async execute(eventId: string, input: Validator) {
    const youtubeId = parseYouTubeUrl(input.youtubeUrl);
    if (!youtubeId) throw new Error("Invalid YouTube URL");

    return this.db.tx(async (tx) => {
      const [{ v: currentMax }] = await tx
        .select({ v: dmax(eventVideos.sortOrder) })
        .from(eventVideos)
        .where(eq(eventVideos.eventId, eventId));
      const [video] = await tx.insert(eventVideos).values({
        eventId,
        title: input.title,
        description: input.description,
        youtubeUrl: input.youtubeUrl,
        youtubeId,
        thumbnailUrl: thumbnailUrlFor(youtubeId),
        sortOrder: (currentMax ?? 0) + 10,
      }).returning();
      return video;
    });
  }
}
```

- [ ] **Step 4: Controller — catch invalid-URL as 400**

- [ ] **Step 5: Routes with feature gate**

```typescript
// apps/backend/app/modules/orgs/videos/routes.ts
import router from "@adonisjs/core/services/router";
import { middleware } from "#start/kernel";

const List = () => import("./list/controller.ts");
const Create = () => import("./create/controller.ts");
const Update = () => import("./update/controller.ts");
const Delete = () => import("./delete/controller.ts");
const Reorder = () => import("./reorder/controller.ts");

router.group(() => {
  // Read-only — all members see videos.
  router.get(":slug/videos", [List]).use([
    middleware.auth(), middleware.org(), middleware.orgEvent(),
    middleware.orgMember(), middleware.orgFeature("video_library"),
  ]);

  // Admin CRUD.
  router.post(":slug/videos", [Create]).use([
    middleware.auth(), middleware.org(), middleware.orgEvent(),
    middleware.orgMember(), middleware.orgAdmin(), middleware.orgFeature("video_library"),
  ]);
  router.patch(":slug/videos/:id", [Update]).use([
    middleware.auth(), middleware.org(), middleware.orgEvent(),
    middleware.orgMember(), middleware.orgAdmin(), middleware.orgFeature("video_library"),
  ]);
  router.delete(":slug/videos/:id", [Delete]).use([
    middleware.auth(), middleware.org(), middleware.orgEvent(),
    middleware.orgMember(), middleware.orgAdmin(), middleware.orgFeature("video_library"),
  ]);
  router.post(":slug/videos/reorder", [Reorder]).use([
    middleware.auth(), middleware.org(), middleware.orgEvent(),
    middleware.orgMember(), middleware.orgAdmin(), middleware.orgFeature("video_library"),
  ]);
}).prefix("orgs").openapi({ tags: ["Org Videos"] });
```

Import from `apps/backend/app/modules/orgs/routes.ts`.

- [ ] **Step 6: Implement `update`, `delete`, `list`, `reorder`**

`list` — returns videos ordered by `sort_order`. If assignments feature is on AND caller is not admin, only returns videos assigned to caller's roster id (use `ctx.orgRoster`).

`reorder` — accepts `{ ids: string[] }`, writes sort_order as `(index + 1) * 10`. Whole-list replacement, not partial.

- [ ] **Step 7: Run tests + commit**

---

## Task 4: Video assignments (feature-gated)

**Files:**
- Create: `apps/backend/app/modules/orgs/videos/assignments/{create,delete,list}/*`

Assignment routes only active when either `video_coach_assignment` or `video_dancer_assignment` is true. Add the check inline in the service since the feature key depends on the roster type.

```typescript
// apps/backend/app/modules/orgs/videos/assignments/create/controller.ts
// Inside handle:
const features = ctx.org!.features as Record<string, boolean>;
if (!features.video_coach_assignment && !features.video_dancer_assignment) {
  return ctx.response.notFound({ message: "Not found." });
}
// ...
```

`POST /orgs/:slug/videos/:videoId/assignments` body `{ rosterIds: string[] }` — bulk assign.
`DELETE /orgs/:slug/videos/:videoId/assignments/:rosterId` — remove.

`list` is implicit in the video list endpoint (Task 3 — filter by assignment when feature on).

- [ ] **TDD cycle + commit**

---

## Task 5: Frontend — video queries + card + modal

**Files:**
- Create: `apps/frontend/src/features/org/api/video-queries.ts`
- Create: `apps/frontend/src/features/org/components/video-card.tsx`
- Create: `apps/frontend/src/features/org/components/video-modal.tsx`

```typescript
// apps/frontend/src/features/org/api/video-queries.ts
import { $api } from "@/lib/api/client";

export const videoQueries = {
  list: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/videos", { params: { path: { slug } } }),
};
```

```tsx
// apps/frontend/src/features/org/components/video-card.tsx
export function VideoCard({ video, onOpen }: { video: any; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left"
    >
      <div className="relative aspect-video">
        <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
          <span className="rounded-full bg-white/90 p-4 text-black">▶</span>
        </div>
      </div>
      <div className="p-3">
        <div className="line-clamp-2 text-sm font-semibold">{video.title}</div>
      </div>
    </button>
  );
}
```

```tsx
// apps/frontend/src/features/org/components/video-modal.tsx
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function VideoModal({ videoId, open, onOpenChange }: {
  videoId: string | null; open: boolean; onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        {videoId && (
          <div className="aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              className="h-full w-full"
              allow="autoplay; fullscreen"
              title="Video"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Build + commit**

---

## Task 6: Frontend — video library pages (shared across roles)

Since admin, coach, and dancer all consume the same `GET /orgs/:slug/videos`, use a shared component. Admin gets extra CRUD affordances.

**Files:**
- Create: `apps/frontend/src/features/org/components/video-library.tsx`
- Create: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/videos.tsx`
- Create: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/dancer/videos.tsx`
- Create: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/videos.tsx`

```tsx
// apps/frontend/src/features/org/components/video-library.tsx
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { VideoCard } from "./video-card";
import { VideoModal } from "./video-modal";
import { videoQueries } from "@/features/org/api/video-queries";

export function VideoLibrary({ slug, admin }: { slug: string; admin?: React.ReactNode }) {
  const { data } = useSuspenseQuery(videoQueries.list(slug));
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-5xl space-y-5 p-5 text-white">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Videos</h1>
        {admin}
      </header>
      {data.length === 0 ? (
        <p className="py-20 text-center opacity-60">No videos yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {data.map((v: any) => (
            <VideoCard key={v.id} video={v} onOpen={() => setActiveId(v.youtubeId)} />
          ))}
        </div>
      )}
      <VideoModal videoId={activeId} open={!!activeId} onOpenChange={(o) => !o && setActiveId(null)} />
    </main>
  );
}
```

Role route files each render `<VideoLibrary slug={orgSlug} />` with the admin one passing an `admin={<AddVideoButton />}` slot. Admin page adds a form to paste a YouTube URL + title + description.

- [ ] **Build + commit**

---

## Task 7: Nav gating — hide video link when feature off

In `org-header.tsx` or the role-specific nav, read `useOrg().hasFeature("video_library")` and conditionally render the link. Gated link never renders — never greyed out.

- [ ] **Commit**

---

## Task 8: Verification

- [ ] Backend tests pass.
- [ ] Frontend build clean.
- [ ] Manual: as Summit admin, add a video via YouTube URL, verify thumbnail renders. Edit, delete, reorder.
- [ ] Manual: as coach, open video in modal; verify iframe loads.
- [ ] Manual: toggle `features.video_library = false` in a test org — verify frontend nav hides the link and API returns 404.
- [ ] Manual: if testing assignment feature, toggle `video_coach_assignment = true`, assign a video to coach A, log in as coach B — coach B should not see it.

---

## Definition of Done

- Admins can CRUD videos with automatic YouTube id + thumbnail extraction.
- All members can browse videos; assignments (if enabled) restrict visibility.
- Feature gate is invisible when off.
- Backend tests + frontend build clean.
