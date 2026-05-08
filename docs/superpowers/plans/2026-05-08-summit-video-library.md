# Summit Video Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build admin video management and dancer video viewing pages for The Summit, plus scaffold the dancer layout.

**Architecture:** Org-scoped routes under `_org/$orgSlug/_authenticated/`. Admin page adds a video library to the existing admin layout. Dancer gets a new layout (sidebar + route guard) modeled on the coach layout, with the video library as its first page. Both pages share a card grid grouped by category. Heavy reuse of existing `VideoCard`, `StatCell`, sidebar, and filter toolbar patterns.

**Tech Stack:** TanStack Router (file-based routes), TanStack React Query, BaseUI Select, openapi-fetch client, Tailwind CSS, lucide-react icons.

**Spec:** `docs/superpowers/specs/2026-05-08-summit-video-library-design.md`

---

## File Map

```
apps/frontend/src/
├── features/org/
│   ├── api/
│   │   └── video-queries.ts                    ← NEW: queries + mutations for event videos & categories
│   └── components/
│       ├── admin-sidebar.tsx                    ← MODIFY: add Video Library nav item
│       ├── dancer-sidebar.tsx                   ← NEW: dancer sidebar (based on coach-sidebar)
│       └── event-video/
│           ├── event-video-card.tsx             ← NEW: Summit video card (adapted from library VideoCard)
│           ├── event-video-grid.tsx             ← NEW: grouped card grid with sticky category headers
│           ├── video-library-toolbar.tsx        ← NEW: search + category filter toolbar
│           ├── manage-categories-dialog.tsx     ← NEW: admin category CRUD dialog
│           └── add-edit-video-dialog.tsx        ← NEW: admin video add/edit dialog with YouTube preview
├── routes/_org/$orgSlug/_authenticated/
│   ├── admin/
│   │   └── video-library.tsx                   ← NEW: admin video library route
│   └── dancer/
│       ├── route.tsx                           ← NEW: dancer layout (guard + sidebar + Outlet)
│       ├── index.tsx                           ← NEW: redirect to video-library
│       └── video-library.tsx                   ← NEW: dancer video library route
```

---

### Task 1: Video API Layer — Types, Queries, and Mutations

**Files:**
- Create: `apps/frontend/src/features/org/api/video-queries.ts`

This task builds the data layer. All subsequent tasks depend on these types and hooks.

- [ ] **Step 1: Create the video queries and mutations file**

Create `apps/frontend/src/features/org/api/video-queries.ts` with types, query definitions, and mutation hooks:

```typescript
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api/client";
import { toastManager } from "@/components/ui/toast-manager";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VideoCategory {
  id: string;
  eventId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface EventVideo {
  id: string;
  eventId: string;
  categoryId: string;
  title: string;
  youtubeId: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventVideoGroup {
  category: VideoCategory;
  videos: EventVideo[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchJson<T>(path: string): Promise<T> {
  const res = await client.GET(path as never);
  if (res.error) throw res.error;
  return res.data as T;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const raw = client as unknown as {
    POST: (p: string, opts: { body: unknown }) => Promise<{ data: T; error?: unknown }>;
  };
  const res = await raw.POST(path, { body });
  if (res.error) throw res.error;
  return res.data;
}

async function patchJson<T>(path: string, body: unknown): Promise<T> {
  const raw = client as unknown as {
    PATCH: (p: string, opts: { body: unknown }) => Promise<{ data: T; error?: unknown }>;
  };
  const res = await raw.PATCH(path, { body });
  if (res.error) throw res.error;
  return res.data;
}

async function deleteJson(path: string): Promise<void> {
  const raw = client as unknown as {
    DELETE: (p: string) => Promise<{ error?: unknown }>;
  };
  const res = await raw.DELETE(path);
  if (res.error) throw res.error;
}

// ---------------------------------------------------------------------------
// Query keys & options
// ---------------------------------------------------------------------------

export const videoQueries = {
  categories: (slug: string, eventId: string) =>
    queryOptions({
      queryKey: ["orgs", slug, "events", eventId, "video-categories"],
      queryFn: () =>
        fetchJson<VideoCategory[]>(`/orgs/${slug}/events/${eventId}/video-categories`),
      enabled: !!eventId,
    }),

  videos: (slug: string, eventId: string) =>
    queryOptions({
      queryKey: ["orgs", slug, "events", eventId, "videos"],
      queryFn: () =>
        fetchJson<EventVideo[]>(`/orgs/${slug}/events/${eventId}/videos`),
      enabled: !!eventId,
    }),
};

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateCategory(slug: string, eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string }) =>
      postJson<VideoCategory>(`/orgs/${slug}/events/${eventId}/video-categories`, body),
    onSuccess: () => {
      void qc.invalidateQueries(videoQueries.categories(slug, eventId));
      toastManager.add({ title: "Category created", type: "success" });
    },
    onError: () => {
      toastManager.add({ title: "Failed to create category", type: "error" });
    },
  });
}

export function useDeleteCategory(slug: string, eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) =>
      deleteJson(`/orgs/${slug}/events/${eventId}/video-categories/${categoryId}`),
    onSuccess: () => {
      void qc.invalidateQueries(videoQueries.categories(slug, eventId));
      toastManager.add({ title: "Category deleted", type: "success" });
    },
    onError: () => {
      toastManager.add({ title: "Cannot delete — category has videos", type: "error" });
    },
  });
}

export function useCreateVideo(slug: string, eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; categoryId: string; youtubeId: string }) =>
      postJson<EventVideo>(`/orgs/${slug}/events/${eventId}/videos`, body),
    onSuccess: () => {
      void qc.invalidateQueries(videoQueries.videos(slug, eventId));
      toastManager.add({ title: "Video added", type: "success" });
    },
    onError: () => {
      toastManager.add({ title: "Failed to add video", type: "error" });
    },
  });
}

export function useUpdateVideo(slug: string, eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ videoId, ...body }: { videoId: string; title: string; categoryId: string; youtubeId: string }) =>
      patchJson<EventVideo>(`/orgs/${slug}/events/${eventId}/videos/${videoId}`, body),
    onSuccess: () => {
      void qc.invalidateQueries(videoQueries.videos(slug, eventId));
      toastManager.add({ title: "Video updated", type: "success" });
    },
    onError: () => {
      toastManager.add({ title: "Failed to update video", type: "error" });
    },
  });
}

export function useDeleteVideo(slug: string, eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (videoId: string) =>
      deleteJson(`/orgs/${slug}/events/${eventId}/videos/${videoId}`),
    onSuccess: () => {
      void qc.invalidateQueries(videoQueries.videos(slug, eventId));
      toastManager.add({ title: "Video deleted", type: "success" });
    },
    onError: () => {
      toastManager.add({ title: "Failed to delete video", type: "error" });
    },
  });
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd apps/frontend && npx tsc --noEmit --pretty 2>&1 | head -30`

Fix any import path issues. The `client.GET` cast may need adjustment depending on the exact openapi-fetch version — match the pattern used in `admin-queries.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/features/org/api/video-queries.ts
git commit -m "feat(video-library): add video queries, mutations, and types"
```

---

### Task 2: Dancer Layout Scaffolding

**Files:**
- Create: `apps/frontend/src/features/org/components/dancer-sidebar.tsx`
- Create: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/dancer/route.tsx`
- Create: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/dancer/index.tsx`

This task creates the dancer portal shell. Based directly on the coach layout at `routes/_org/$orgSlug/_authenticated/coach/route.tsx` and `features/org/components/coach-sidebar.tsx`.

- [ ] **Step 1: Create DancerSidebar**

Create `apps/frontend/src/features/org/components/dancer-sidebar.tsx`. Copy the full structure from `coach-sidebar.tsx` and make these changes:

1. Change the role label from `"Coach"` to `"Dancer"`
2. Replace nav items:

```typescript
const dashboardItem = {
  label: "Video Library",
  icon: PlayCircleIcon,
  to: "/$orgSlug/dancer/video-library" as const,
  exact: false,
};

const navSections: {
  title: string;
  items: { label: string; icon: any; to: string }[];
}[] = [];
```

3. Update imports: add `PlayCircleIcon` from lucide-react, remove `SearchIcon` and `CalendarIcon`
4. Change the `SidebarMenuButton` link in `SidebarHeader` to point to `/$orgSlug/dancer`
5. Change the sub-label in the header from `"Coach"` to `"Dancer"`
6. Update `isItemActive` to check `location.pathname.includes("/dancer")` for the current view detection
7. Keep the full footer with avatar, theme toggle, view switcher, and logout — identical structure to coach sidebar

The rest of the component (collapsed icon mode, footer menu, theme switcher, view switcher) stays identical.

- [ ] **Step 2: Create dancer route layout**

Create `apps/frontend/src/routes/_org/$orgSlug/_authenticated/dancer/route.tsx`:

```typescript
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DancerSidebar } from "@/features/org/components/dancer-sidebar";
import { orgQueries } from "@/features/org/api/queries";

export const Route = createFileRoute("/_org/$orgSlug/_authenticated/dancer")({
  beforeLoad: async ({ context, params }) => {
    const data = (context.queryClient.getQueryData(
      orgQueries.org(params.orgSlug).queryKey,
    ) ??
      (await context.queryClient.ensureQueryData(
        orgQueries.org(params.orgSlug),
      ))) as { membership?: { role: string; type: string } | null } | null;
    const role = data?.membership?.role;
    const type = data?.membership?.type;
    if (role !== "admin" && type !== "dancer") {
      throw redirect({ to: "/" });
    }
  },
  component: DancerLayout,
});

function DancerLayout() {
  return (
    <SidebarProvider className="h-svh">
      <DancerSidebar />
      <SidebarInset className="overflow-hidden">
        <header className="bg-sidebar text-sidebar-foreground flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-muted-foreground text-sm font-medium 2xl:text-base">
            Dancer
          </span>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 3: Create dancer index redirect**

Create `apps/frontend/src/routes/_org/$orgSlug/_authenticated/dancer/index.tsx`:

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/dancer/",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$orgSlug/dancer/video-library",
      params: { orgSlug: params.orgSlug },
    });
  },
});
```

- [ ] **Step 4: Verify route generation**

Run: `cd apps/frontend && npx tsc --noEmit --pretty 2>&1 | head -30`

TanStack Router auto-generates the route tree. If there's a codegen step, run it:
`cd apps/frontend && npx tsr generate` (or check `package.json` for the route generation script).

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/features/org/components/dancer-sidebar.tsx \
       apps/frontend/src/routes/_org/\$orgSlug/_authenticated/dancer/
git commit -m "feat(dancer): scaffold dancer layout with sidebar and route guard"
```

---

### Task 3: Add Video Library Nav Item to Admin Sidebar

**Files:**
- Modify: `apps/frontend/src/features/org/components/admin-sidebar.tsx`

- [ ] **Step 1: Add Video Library to admin nav sections**

In `admin-sidebar.tsx`, add a new nav section between "Rosters" and "Settings". Import `PlayCircleIcon` from lucide-react.

Add to the `navSections` array — insert a new section after "Rosters":

```typescript
{
  title: "Content",
  items: [
    {
      label: "Video Library",
      icon: PlayCircleIcon,
      to: "/$orgSlug/admin/video-library" as const,
    },
  ],
},
```

Update the import line at the top to include `PlayCircleIcon`:

```typescript
import {
  CheckIcon,
  ChevronDownIcon,
  ClipboardListIcon,
  EyeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MicIcon,
  MonitorIcon,
  MoonIcon,
  PlayCircleIcon,
  SettingsIcon,
  SunIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
```

Note: The "Content" section has only one item, so it renders as a single full-width link (the existing code uses `grid-cols-2` only when `section.items.length > 1`). Check the rendering — the admin sidebar uses `grid grid-cols-2` unconditionally on the items div. If the single item looks odd in a 2-column grid, you may need to conditionally apply the grid class like the coach sidebar does:

```typescript
<div className={`border-sidebar-border border-t ${section.items.length > 1 ? "grid grid-cols-2" : ""}`}>
```

Check if admin-sidebar already has this conditional. If not, add it.

- [ ] **Step 2: Verify sidebar renders**

Run: `cd apps/frontend && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/features/org/components/admin-sidebar.tsx
git commit -m "feat(admin): add Video Library nav item to admin sidebar"
```

---

### Task 4: Event Video Card Component

**Files:**
- Create: `apps/frontend/src/features/org/components/event-video/event-video-card.tsx`

Adapted from `features/library/components/video-card.tsx`. Uses the same visual pattern (Frame + FramePanel, YouTube thumbnail, modal playback) but works with `EventVideo` types and supports optional admin actions.

- [ ] **Step 1: Create the event video card component**

Create `apps/frontend/src/features/org/components/event-video/event-video-card.tsx`:

```typescript
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Frame, FramePanel } from "@/components/ui/frame";
import { PencilIcon, Trash2Icon, VideoIcon, XIcon } from "lucide-react";
import { useState } from "react";
import type { EventVideo, VideoCategory } from "@/features/org/api/video-queries";

interface EventVideoCardProps {
  video: EventVideo;
  category?: VideoCategory;
  onEdit?: (video: EventVideo) => void;
  onDelete?: (video: EventVideo) => void;
}

export function EventVideoCard({ video, category, onEdit, onDelete }: EventVideoCardProps) {
  const [open, setOpen] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${video.youtubeId}`;
  const isAdmin = !!(onEdit || onDelete);

  return (
    <>
      <Frame compact className="group flex flex-col [content-visibility:auto]">
        <FramePanel side="inset" className="flex flex-col">
          <button
            type="button"
            className="relative aspect-video w-full cursor-pointer overflow-hidden"
            onClick={() => setOpen(true)}
          >
            <img
              src={thumbnailUrl}
              alt={video.title}
              className="absolute inset-0 size-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                <VideoIcon className="size-5 text-white" />
              </div>
            </div>
            {category && (
              <Badge
                variant="secondary"
                className="absolute top-2 left-2 bg-black/50 text-[10px] text-white backdrop-blur-sm"
              >
                {category.name}
              </Badge>
            )}
          </button>

          <div className="relative flex items-start gap-2 px-3 py-2.5">
            <span className="line-clamp-2 min-w-0 flex-1 text-sm font-medium">
              {video.title}
            </span>
            {isAdmin && (
              <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => { e.stopPropagation(); onEdit(video); }}
                  >
                    <PencilIcon className="size-3" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => { e.stopPropagation(); onDelete(video); }}
                  >
                    <Trash2Icon className="size-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </FramePanel>
      </Frame>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl p-0">
          <div className="aspect-video w-full">
            <iframe
              src={embedUrl}
              title={video.title}
              className="size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <DialogFooter className="px-4 pb-4">
            <span className="mr-auto text-sm font-medium">{video.title}</span>
            <DialogClose render={<Button variant="outline" size="sm" />}>
              <XIcon className="mr-1 size-3" />
              Close
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/frontend && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/features/org/components/event-video/event-video-card.tsx
git commit -m "feat(video-library): add EventVideoCard component with modal playback"
```

---

### Task 5: Video Grid and Toolbar Components

**Files:**
- Create: `apps/frontend/src/features/org/components/event-video/event-video-grid.tsx`
- Create: `apps/frontend/src/features/org/components/event-video/video-library-toolbar.tsx`

- [ ] **Step 1: Create the video grid component**

Create `apps/frontend/src/features/org/components/event-video/event-video-grid.tsx`:

```typescript
import type { EventVideo, EventVideoGroup } from "@/features/org/api/video-queries";
import { EventVideoCard } from "./event-video-card";
import type { VideoCategory } from "@/features/org/api/video-queries";

const ACCENT_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-cyan-500",
];

interface EventVideoGridProps {
  groups: EventVideoGroup[];
  onEdit?: (video: EventVideo) => void;
  onDelete?: (video: EventVideo) => void;
}

export function EventVideoGrid({ groups, onEdit, onDelete }: EventVideoGridProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground text-sm">
          Check back soon — videos will be posted here before the event.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {groups.map((group, i) => (
        <CategorySection
          key={group.category.id}
          category={group.category}
          videos={group.videos}
          accentColor={ACCENT_COLORS[i % ACCENT_COLORS.length]}
          onEdit={onEdit}
          onDelete={onDelete}
          showBorder={i > 0}
        />
      ))}
    </div>
  );
}

function CategorySection({
  category,
  videos,
  accentColor,
  onEdit,
  onDelete,
  showBorder,
}: {
  category: VideoCategory;
  videos: EventVideo[];
  accentColor: string;
  onEdit?: (video: EventVideo) => void;
  onDelete?: (video: EventVideo) => void;
  showBorder: boolean;
}) {
  return (
    <div className="px-4">
      <div
        className={`sticky top-0 z-10 bg-background flex items-center gap-2 pt-4 pb-3 ${showBorder ? "border-border border-t" : ""}`}
      >
        <div className={`size-1.5 shrink-0 rounded-full ${accentColor}`} />
        <span className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          {category.name}
        </span>
        <span className="text-muted-foreground/60 text-[11px]">
          {videos.length} {videos.length === 1 ? "video" : "videos"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 pb-5 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <EventVideoCard
            key={video.id}
            video={video}
            category={category}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the toolbar component**

Create `apps/frontend/src/features/org/components/event-video/video-library-toolbar.tsx`:

```typescript
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon, SearchIcon, SettingsIcon, XIcon } from "lucide-react";
import type { VideoCategory } from "@/features/org/api/video-queries";

interface VideoLibraryToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string | null;
  onCategoryFilterChange: (value: string | null) => void;
  categories: VideoCategory[];
  onManageCategories?: () => void;
  onAddVideo?: () => void;
}

export function VideoLibraryToolbar({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  onManageCategories,
  onAddVideo,
}: VideoLibraryToolbarProps) {
  const categoryItems = [
    { value: "__all__", label: "All categories" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];
  const hasActiveFilters = search.length > 0 || categoryFilter !== null;

  return (
    <div className="border-border flex items-center gap-2 border-b px-3 py-2">
      <InputGroup className="w-48 shrink-0">
        <InputGroupAddon>
          <SearchIcon className="size-3.5" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search videos..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="text-sm"
        />
      </InputGroup>

      <div className="bg-border h-5 w-px shrink-0" />

      <Select
        items={categoryItems}
        value={categoryFilter ?? "__all__"}
        onValueChange={(v) => onCategoryFilterChange(v === "__all__" ? null : v)}
      >
        <SelectTrigger size="sm" className="w-[160px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {categoryItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onSearchChange("");
            onCategoryFilterChange(null);
          }}
          className="gap-1"
        >
          <XIcon className="size-3" />
          Clear
        </Button>
      )}

      {(onManageCategories || onAddVideo) && (
        <>
          <div className="flex-1" />
          {onManageCategories && (
            <Button variant="outline" size="sm" onClick={onManageCategories} className="gap-1.5">
              <SettingsIcon className="size-3" />
              Manage Categories
            </Button>
          )}
          {onAddVideo && (
            <Button size="sm" onClick={onAddVideo} className="gap-1.5">
              <PlusIcon className="size-3" />
              Add Video
            </Button>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify both compile**

Run: `cd apps/frontend && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/features/org/components/event-video/event-video-grid.tsx \
       apps/frontend/src/features/org/components/event-video/video-library-toolbar.tsx
git commit -m "feat(video-library): add EventVideoGrid and VideoLibraryToolbar components"
```

---

### Task 6: Manage Categories Dialog

**Files:**
- Create: `apps/frontend/src/features/org/components/event-video/manage-categories-dialog.tsx`

- [ ] **Step 1: Create the manage categories dialog**

Create `apps/frontend/src/features/org/components/event-video/manage-categories-dialog.tsx`:

```typescript
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import type { VideoCategory } from "@/features/org/api/video-queries";
import {
  useCreateCategory,
  useDeleteCategory,
} from "@/features/org/api/video-queries";

interface ManageCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: VideoCategory[];
  videoCounts: Record<string, number>;
  slug: string;
  eventId: string;
}

export function ManageCategoriesDialog({
  open,
  onOpenChange,
  categories,
  videoCounts,
  slug,
  eventId,
}: ManageCategoriesDialogProps) {
  const [newName, setNewName] = useState("");
  const createCategory = useCreateCategory(slug, eventId);
  const deleteCategory = useDeleteCategory(slug, eventId);

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createCategory.mutate({ name: trimmed }, { onSuccess: () => setNewName("") });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Add or remove video categories for this event.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {categories.length === 0 && (
            <p className="text-muted-foreground text-center text-sm py-4">
              No categories yet. Add one below.
            </p>
          )}

          {categories.map((cat) => {
            const count = videoCounts[cat.id] ?? 0;
            const hasVideos = count > 0;
            return (
              <div
                key={cat.id}
                className="border-border flex items-center gap-3 rounded-md border px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {cat.name}
                </span>
                {hasVideos && (
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {count} {count === 1 ? "video" : "videos"}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={hasVideos || deleteCategory.isPending}
                  onClick={() => deleteCategory.mutate(cat.id)}
                  title={hasVideos ? "Remove videos first" : "Delete category"}
                >
                  {deleteCategory.isPending ? (
                    <Spinner className="size-3" />
                  ) : (
                    <Trash2Icon className="size-3" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!newName.trim() || createCategory.isPending}
          >
            {createCategory.isPending ? <Spinner className="size-3" /> : "Add"}
          </Button>
        </div>

        <div className="flex justify-end pt-2">
          <DialogClose render={<Button variant="outline" size="sm" />}>
            Done
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/frontend && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/features/org/components/event-video/manage-categories-dialog.tsx
git commit -m "feat(video-library): add ManageCategoriesDialog for category CRUD"
```

---

### Task 7: Add/Edit Video Dialog

**Files:**
- Create: `apps/frontend/src/features/org/components/event-video/add-edit-video-dialog.tsx`

- [ ] **Step 1: Create the add/edit video dialog**

Create `apps/frontend/src/features/org/components/event-video/add-edit-video-dialog.tsx`:

```typescript
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { getYouTubeId } from "@/utils/get-youtube-id";
import { useMemo, useState, useEffect } from "react";
import type { EventVideo, VideoCategory } from "@/features/org/api/video-queries";
import {
  useCreateVideo,
  useUpdateVideo,
} from "@/features/org/api/video-queries";

interface AddEditVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: VideoCategory[];
  slug: string;
  eventId: string;
  editingVideo?: EventVideo | null;
}

export function AddEditVideoDialog({
  open,
  onOpenChange,
  categories,
  slug,
  eventId,
  editingVideo,
}: AddEditVideoDialogProps) {
  const isEditing = !!editingVideo;
  const createVideo = useCreateVideo(slug, eventId);
  const updateVideo = useUpdateVideo(slug, eventId);
  const isPending = createVideo.isPending || updateVideo.isPending;

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && editingVideo) {
      setTitle(editingVideo.title);
      setCategoryId(editingVideo.categoryId);
      setYoutubeUrl(`https://www.youtube.com/watch?v=${editingVideo.youtubeId}`);
      setErrors({});
    } else if (open) {
      setTitle("");
      setCategoryId("");
      setYoutubeUrl("");
      setErrors({});
    }
  }, [open, editingVideo]);

  const youtubeId = useMemo(() => getYouTubeId(youtubeUrl), [youtubeUrl]);

  const categoryItems = categories.map((c) => ({ value: c.id, label: c.name }));

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Title is required";
    if (!categoryId) next.categoryId = "Category is required";
    if (!youtubeId) next.youtubeUrl = "Enter a valid YouTube URL";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate() || !youtubeId) return;

    const body = { title: title.trim(), categoryId, youtubeId };

    if (isEditing && editingVideo) {
      updateVideo.mutate(
        { videoId: editingVideo.id, ...body },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createVideo.mutate(body, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Video" : "Add Video"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <Field invalid={!!errors.title}>
            <FieldLabel>Title</FieldLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hip Hop Combo – Week 1"
            />
            {errors.title && <FieldError>{errors.title}</FieldError>}
          </Field>

          <Field invalid={!!errors.categoryId}>
            <FieldLabel>Category</FieldLabel>
            <Select
              items={categoryItems}
              value={categoryId || undefined}
              onValueChange={setCategoryId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && <FieldError>{errors.categoryId}</FieldError>}
          </Field>

          <Field invalid={!!errors.youtubeUrl}>
            <FieldLabel>YouTube URL</FieldLabel>
            <Input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {errors.youtubeUrl && <FieldError>{errors.youtubeUrl}</FieldError>}
          </Field>

          {youtubeId && (
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="Preview"
                  className="size-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Spinner className="mr-1.5 size-3" />}
            {isEditing ? "Save Changes" : "Add Video"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/frontend && npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/features/org/components/event-video/add-edit-video-dialog.tsx
git commit -m "feat(video-library): add AddEditVideoDialog with YouTube preview"
```

---

### Task 8: Admin Video Library Route Page

**Files:**
- Create: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/video-library.tsx`

This wires everything together for the admin view.

- [ ] **Step 1: Create the admin video library route**

Create `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/video-library.tsx`:

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useDeferredValue, useMemo, useState } from "react";
import { StatCell } from "@/features/org/components/dashboard-shared";
import { EventVideoGrid } from "@/features/org/components/event-video/event-video-grid";
import { VideoLibraryToolbar } from "@/features/org/components/event-video/video-library-toolbar";
import { ManageCategoriesDialog } from "@/features/org/components/event-video/manage-categories-dialog";
import { AddEditVideoDialog } from "@/features/org/components/event-video/add-edit-video-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  videoQueries,
  useDeleteVideo,
  type EventVideo,
  type EventVideoGroup,
} from "@/features/org/api/video-queries";
import { adminQueries } from "@/features/org/api/admin-queries";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/admin/video-library",
)({
  component: AdminVideoLibrary,
});

function AdminVideoLibrary() {
  const { orgSlug } = Route.useParams();
  const { data: events } = useSuspenseQuery(adminQueries.events(orgSlug));
  const activeEvent = events.find((e) => e.isActive);
  const eventId = activeEvent?.id ?? "";

  const { data: categories = [] } = useSuspenseQuery(
    videoQueries.categories(orgSlug, eventId),
  );
  const { data: videos = [] } = useSuspenseQuery(
    videoQueries.videos(orgSlug, eventId),
  );

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<EventVideo | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<EventVideo | null>(null);

  const deleteVideo = useDeleteVideo(orgSlug, eventId);

  const videoCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of videos) {
      counts[v.categoryId] = (counts[v.categoryId] ?? 0) + 1;
    }
    return counts;
  }, [videos]);

  const groups: EventVideoGroup[] = useMemo(() => {
    const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted
      .map((cat) => {
        let catVideos = videos
          .filter((v) => v.categoryId === cat.id)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        if (deferredSearch) {
          const q = deferredSearch.toLowerCase();
          catVideos = catVideos.filter((v) => v.title.toLowerCase().includes(q));
        }

        return { category: cat, videos: catVideos };
      })
      .filter((g) => {
        if (categoryFilter && g.category.id !== categoryFilter) return false;
        return g.videos.length > 0;
      });
  }, [categories, videos, categoryFilter, deferredSearch]);

  const lastUpdated = useMemo(() => {
    if (videos.length === 0) return "—";
    const newest = videos.reduce((a, b) =>
      a.updatedAt > b.updatedAt ? a : b,
    );
    return formatDistanceToNow(new Date(newest.updatedAt), { addSuffix: true });
  }, [videos]);

  function handleEdit(video: EventVideo) {
    setEditingVideo(video);
    setAddEditOpen(true);
  }

  function handleDelete(video: EventVideo) {
    setDeletingVideo(video);
  }

  function confirmDelete() {
    if (!deletingVideo) return;
    deleteVideo.mutate(deletingVideo.id, {
      onSettled: () => setDeletingVideo(null),
    });
  }

  if (!activeEvent) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground text-sm">
          No active event. Create or activate an event to manage videos.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <header className="flex items-baseline gap-3 px-4 py-4">
        <h1 className="text-lg font-semibold tracking-tight 2xl:text-xl">
          Video Library
        </h1>
        <span className="text-muted-foreground text-xs tabular-nums 2xl:text-sm">
          {videos.length} videos · {categories.length} categories
        </span>
      </header>

      <section aria-label="Video stats" className="border-border flex items-stretch border-y">
        <StatCell label="Total Videos" value={videos.length} />
        <StatCell label="Categories" value={categories.length} />
        <StatCell label="Last Updated" value={lastUpdated} />
      </section>

      <VideoLibraryToolbar
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        categories={categories}
        onManageCategories={() => setManageCategoriesOpen(true)}
        onAddVideo={() => {
          setEditingVideo(null);
          setAddEditOpen(true);
        }}
      />

      <div className="flex-1 pb-8">
        <EventVideoGrid
          groups={groups}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <ManageCategoriesDialog
        open={manageCategoriesOpen}
        onOpenChange={setManageCategoriesOpen}
        categories={categories}
        videoCounts={videoCounts}
        slug={orgSlug}
        eventId={eventId}
      />

      <AddEditVideoDialog
        open={addEditOpen}
        onOpenChange={setAddEditOpen}
        categories={categories}
        slug={orgSlug}
        eventId={eventId}
        editingVideo={editingVideo}
      />

      <AlertDialog
        open={!!deletingVideo}
        onOpenChange={(open) => { if (!open) setDeletingVideo(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{deletingVideo?.title}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

- [ ] **Step 2: Verify route generation and compilation**

Run: `cd apps/frontend && npx tsc --noEmit --pretty 2>&1 | head -30`

If TanStack Router needs a codegen step, also run: `cd apps/frontend && npx tsr generate`

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/routes/_org/\$orgSlug/_authenticated/admin/video-library.tsx
git commit -m "feat(admin): add video library route with full CRUD"
```

---

### Task 9: Dancer Video Library Route Page

**Files:**
- Create: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/dancer/video-library.tsx`

Read-only view — same layout pattern as admin but without management controls.

- [ ] **Step 1: Create the dancer video library route**

Create `apps/frontend/src/routes/_org/$orgSlug/_authenticated/dancer/video-library.tsx`:

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useDeferredValue, useMemo, useState } from "react";
import { StatCell } from "@/features/org/components/dashboard-shared";
import { EventVideoGrid } from "@/features/org/components/event-video/event-video-grid";
import { VideoLibraryToolbar } from "@/features/org/components/event-video/video-library-toolbar";
import {
  videoQueries,
  type EventVideoGroup,
} from "@/features/org/api/video-queries";
import { adminQueries } from "@/features/org/api/admin-queries";
import { isAfter, subDays } from "date-fns";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/dancer/video-library",
)({
  component: DancerVideoLibrary,
});

function DancerVideoLibrary() {
  const { orgSlug } = Route.useParams();
  const { data: events } = useSuspenseQuery(adminQueries.events(orgSlug));
  const activeEvent = events.find((e) => e.isActive);
  const eventId = activeEvent?.id ?? "";

  const { data: categories = [] } = useSuspenseQuery(
    videoQueries.categories(orgSlug, eventId),
  );
  const { data: videos = [] } = useSuspenseQuery(
    videoQueries.videos(orgSlug, eventId),
  );

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const newThisWeek = useMemo(() => {
    const weekAgo = subDays(new Date(), 7);
    return videos.filter((v) => isAfter(new Date(v.createdAt), weekAgo)).length;
  }, [videos]);

  const groups: EventVideoGroup[] = useMemo(() => {
    const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted
      .map((cat) => {
        let catVideos = videos
          .filter((v) => v.categoryId === cat.id)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        if (deferredSearch) {
          const q = deferredSearch.toLowerCase();
          catVideos = catVideos.filter((v) => v.title.toLowerCase().includes(q));
        }

        return { category: cat, videos: catVideos };
      })
      .filter((g) => {
        if (categoryFilter && g.category.id !== categoryFilter) return false;
        return g.videos.length > 0;
      });
  }, [categories, videos, categoryFilter, deferredSearch]);

  const categoriesWithVideos = useMemo(
    () => categories.filter((c) => videos.some((v) => v.categoryId === c.id)),
    [categories, videos],
  );

  if (!activeEvent) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground text-sm">No active event.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <header className="flex items-baseline gap-3 px-4 py-4">
        <h1 className="text-lg font-semibold tracking-tight 2xl:text-xl">
          Video Library
        </h1>
        <span className="text-muted-foreground text-xs tabular-nums 2xl:text-sm">
          {videos.length} videos · {categoriesWithVideos.length} categories
        </span>
      </header>

      <section aria-label="Video stats" className="border-border flex items-stretch border-y">
        <StatCell label="Total Videos" value={videos.length} />
        <StatCell label="Categories" value={categoriesWithVideos.length} />
        <StatCell label="New This Week" value={newThisWeek} accent="blue" />
      </section>

      <VideoLibraryToolbar
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        categories={categoriesWithVideos}
      />

      <div className="flex-1 pb-8">
        <EventVideoGrid groups={groups} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify route generation and compilation**

Run: `cd apps/frontend && npx tsc --noEmit --pretty 2>&1 | head -30`

If TanStack Router needs a codegen step, also run: `cd apps/frontend && npx tsr generate`

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/routes/_org/\$orgSlug/_authenticated/dancer/video-library.tsx
git commit -m "feat(dancer): add read-only video library page"
```

---

### Task 10: Smoke Test and Final Verification

- [ ] **Step 1: Run full type check**

Run: `cd apps/frontend && npx tsc --noEmit --pretty`

Fix any remaining type errors.

- [ ] **Step 2: Run linter**

Run: `cd apps/frontend && npx eslint src/features/org/components/event-video/ src/features/org/api/video-queries.ts src/features/org/components/dancer-sidebar.tsx src/routes/_org/\$orgSlug/_authenticated/dancer/ src/routes/_org/\$orgSlug/_authenticated/admin/video-library.tsx --fix`

- [ ] **Step 3: Start dev server and verify routes load**

Run: `cd apps/frontend && npm run dev`

Verify in browser:
- `/{orgSlug}/admin/video-library` — admin page loads with stat rail, toolbar, empty state
- `/{orgSlug}/dancer/video-library` — dancer page loads with stat rail, toolbar, empty state
- Admin sidebar shows "Video Library" under "Content" section
- Dancer sidebar shows "Video Library" nav item
- Dancer index redirects to video-library

- [ ] **Step 4: Commit any fixes**

```bash
git add -u
git commit -m "fix: address type and lint issues in video library feature"
```
