# Summit Video Library — Design Spec

## Overview

Two new pages for the Summit event video library:

1. **Admin Video Library** — org admin page for managing YouTube videos organized by admin-defined categories
2. **Dancer Video Library** — read-only page for dancers to browse and watch event prep videos

Plus scaffolding for the **dancer layout** (route wrapper, sidebar, nav) based on the existing coach layout.

## Tickets Covered

- SUM-55: Admin add video via YouTube link
- SUM-56: Admin edit/delete videos
- SUM-57: Dancer browse and watch video library

## Decisions

| Decision | Choice |
|---|---|
| Admin page layout | Card grid with inline management (not table) |
| Dancer page layout | Grouped by category with sticky headers, no sidebar |
| Categories | Admin-defined per event, selected via BaseUI Select (items prop) |
| Video cards | Reuse existing `VideoCard` component (Frame/FramePanel pattern) |
| Dancer layout | Scaffold from coach layout pattern (sidebar, route guard, Outlet) |

---

## 1. Dancer Layout Scaffolding

Based on the coach layout at `_org/$orgSlug/_authenticated/coach/route.tsx`.

### Route Structure

```
_org/$orgSlug/_authenticated/
  dancer/
    route.tsx          ← layout wrapper (guard + sidebar + Outlet)
    index.tsx          ← redirect to video-library (or future dashboard)
    video-library.tsx  ← video library page
```

### Route Guard

- Requires authenticated user with dancer role/membership for the current org event
- Redirect unauthorized users to access-denied or login

### Sidebar Navigation

Reuse `SidebarProvider` pattern from coach layout. Nav links:

- Video Library (active for this feature)
- Placeholder links for future pages (Dashboard, My Profile, My Top 3 Schools, Event Info) — can be added as those tickets are built

### Layout Component

- `SidebarProvider` wrapping the page
- Header with sidebar trigger + "Dancer" label
- `Outlet` for nested route content
- `DancerSidebar` component mirroring `CoachSidebar` structure

---

## 2. Admin Video Library Page

**Route:** `_org/$orgSlug/_authenticated/admin/video-library.tsx`

### Page Structure

```
Header: "Video Library" + count summary
Stat Rail: Total Videos | Categories | Last Updated
Toolbar: Search | Category Filter (Select) | Manage Categories button | + Add Video button
Content: Card grid grouped by category with sticky headers
```

### Stat Rail

Three `StatCell` components:

- **Total Videos** — count of all videos for active event
- **Categories** — count of distinct categories
- **Last Updated** — relative time since most recent video add/edit

### Toolbar

- **Search input** — filters videos by title (client-side, debounced)
- **Category dropdown** — BaseUI Select with `items` prop, filters to single category or "All"
- **Manage Categories button** — opens dialog for CRUD on categories
- **Add Video button** — primary action, opens add video dialog

### Category Management Dialog

- List of existing categories with delete button per row
- Input + "Add" button to create new category
- Categories are event-scoped (tied to the active Summit event)
- Deleting a category with existing videos: block deletion, show count of videos using it

### Add/Edit Video Dialog

Fields:

- **Title** (required, text input)
- **Category** (required, BaseUI Select with items from admin-defined categories)
- **YouTube URL** (required, validated against YouTube URL patterns)
- **Live preview** — when valid YouTube URL entered, show iframe embed preview

Reuse the existing `getYouTubeId` utility and the preview pattern from `features/admin/video-library/components/video-form.tsx`.

### Video Cards

Reuse existing `VideoCard` component with admin overlay:

- Edit/delete action buttons visible on hover (top-right of thumbnail)
- Edit opens the edit dialog pre-filled
- Delete with confirmation (AlertDialog)

### Card Grid

- Responsive: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Grouped by category with sticky headers
- Each category header: accent dot + category name (uppercase) + video count
- Admin controls ordering within categories (drag-to-reorder or manual sort field — stretch goal, not required for v1)

---

## 3. Dancer Video Library Page

**Route:** `_org/$orgSlug/_authenticated/dancer/video-library.tsx`

### Page Structure

```
Header: "Video Library" + count summary
Stat Rail: Total Videos | Categories | New This Week
Toolbar: Search | Category Filter (Select)
Content: Card grid grouped by category with sticky headers
```

### Stat Rail

Three `StatCell` components:

- **Total Videos** — count of all published videos
- **Categories** — count of distinct categories
- **New This Week** — count of videos added in last 7 days (blue accent)

### Toolbar

- **Search input** — filters videos by title (client-side, debounced)
- **Category dropdown** — BaseUI Select with items from categories that have videos

No admin actions (no add, edit, manage buttons).

### Video Cards

Reuse existing `VideoCard` component as-is (no admin overlay):

- Click thumbnail opens modal with YouTube iframe embed
- Category badge on thumbnail (top-left)
- Title below thumbnail

### Card Grid

Same layout as admin:

- Responsive: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Grouped by category with sticky headers
- Sticky headers: accent dot + category name + count

### Empty State

If no videos published yet: "Check back soon — videos will be posted here before the event."

---

## 4. Data Model

### Video Categories (new)

```
event_video_categories
  id: uuid (PK)
  event_id: uuid (FK → events)
  name: string
  sort_order: integer
  created_at: timestamp
```

### Event Videos (new or extended)

```
event_videos
  id: uuid (PK)
  event_id: uuid (FK → events)
  category_id: uuid (FK → event_video_categories)
  title: string
  youtube_id: string (11-char YouTube video ID)
  sort_order: integer (within category)
  created_at: timestamp
  updated_at: timestamp
```

---

## 5. API Endpoints

### Categories

- `GET /orgs/:orgId/events/:eventId/video-categories` — list categories for event
- `POST /orgs/:orgId/events/:eventId/video-categories` — create category (admin)
- `DELETE /orgs/:orgId/events/:eventId/video-categories/:id` — delete category (admin, blocked if videos exist)

### Videos

- `GET /orgs/:orgId/events/:eventId/videos` — list videos grouped by category (coach/dancer/admin)
- `POST /orgs/:orgId/events/:eventId/videos` — add video (admin)
- `PATCH /orgs/:orgId/events/:eventId/videos/:id` — edit video (admin)
- `DELETE /orgs/:orgId/events/:eventId/videos/:id` — delete video (admin)

---

## 6. Components to Reuse

| Component | Source | Usage |
|---|---|---|
| `VideoCard` | `features/library/components/video-card.tsx` | Both admin and dancer card grids |
| `VideosByCategory` | `features/library/components/videos-by-category.tsx` | Category grid layout pattern |
| `StatCell` | `features/org/components/dashboard-shared.tsx` | Stat rails on both pages |
| `Frame` / `FramePanel` | `components/ui/frame.tsx` | Card wrapper (via VideoCard) |
| `getYouTubeId` | Video utility | URL validation and ID extraction |
| `CoachSidebar` pattern | `features/org/components/coach-sidebar.tsx` | Template for DancerSidebar |
| Coach layout | `routes/_org/$orgSlug/_authenticated/coach/route.tsx` | Template for dancer layout |
| Filter toolbar pattern | `features/org/components/dancer-filter-toolbar.tsx` | Search + Select toolbar layout |

## 7. New Components to Build

| Component | Purpose |
|---|---|
| `DancerSidebar` | Sidebar nav for dancer layout |
| `dancer/route.tsx` | Dancer layout wrapper with guard |
| `admin/video-library.tsx` | Admin video library route page |
| `dancer/video-library.tsx` | Dancer video library route page |
| `VideoLibraryToolbar` | Shared toolbar (search + category filter), extended with admin actions |
| `ManageCategoriesDialog` | Admin dialog for category CRUD |
| `AddEditVideoDialog` | Admin dialog for video add/edit with YouTube preview |
