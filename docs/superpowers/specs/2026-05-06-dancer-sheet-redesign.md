# Dancer Sheet Redesign

## Problem

The dancer sheet (`dancer-sheet.tsx`) has three design issues:
1. The header (avatar, bib, name) is cramped and poorly arranged
2. Heart, rating, and notes are lazily stacked vertically, wasting space
3. Notes — the sheet's primary purpose — doesn't get enough prominence
4. Compare button clutters the sheet and belongs on the table instead

## Design

### Header

Avatar (rounded-lg) on the left. Right side stacks vertically:
- **Name** — bold, `SheetTitle`
- **Bib number** — mono font, muted, e.g. `#02`
- **Metadata line** — Class of YYYY, studio, state, GPA joined with ` · ` (existing behavior)
- **Visit Profile →** — indigo link to `/${dancer.username}`, shown only when `dancer.isRegistered && dancer.username`
- **Unregistered badge** — red `Badge` component showing "Unregistered", shown when `!dancer.isRegistered`

### Content Area

**Rating + Heart row** — Single horizontal row. Rating stars on the left (flex-1), favorite heart button on the right. No labels — both are self-explanatory.

**Bio section** — Uppercase "Bio" label. Shows bio text when present. Shows "No bio provided" in muted italic as empty state.

**Notes section** — Uppercase "Notes" label. Textarea fills remaining sheet space. No auto-save — value held in local component state until explicit save.

### Footer

`SheetFooter` with a primary Save button, right-aligned. Saves notes and rating together in a single action. Disabled when nothing has changed (no dirty state). Shows loading spinner while saving.

### Removed

- **Compare button** — removed from the sheet entirely (to be added to the table later)

## Component Changes

### `DancerSheetContent`

Becomes the owner of dirty state. Tracks:
- `notes: string` — initialized from `dancer.note`
- `rating: number | null` — initialized from `dancer.rating`
- `isDirty` — computed from whether either value differs from the initial

Handles a single save action that persists both notes and rating.

### `NotesEditor`

Changes from self-managing auto-save component to a **controlled textarea**:
- Accepts `value: string` and `onChange: (value: string) => void` props
- Removes: debounced auto-save, blur save, beforeunload guard, mutation logic, status display ("Saving...", "Saved")
- Keeps: textarea rendering, placeholder, max length

### `RatingInput`

Changes from self-managing optimistic mutation to a **controlled input**:
- Accepts `value: number | null` and `onChange: (value: number) => void` props
- Removes: mutation logic, optimistic updates, query invalidation
- Keeps: star rendering, haptic feedback, click handling

### `FavoriteButton`

**No changes** — favorite toggling remains instant/optimistic since it's independent of the save flow.

## Backend Change

Add `username: string | null` to the `OrgsIdDancersIdResponse` schema. This allows the frontend to link to `/${username}` for registered dancers. The field is null for unregistered/roster-only dancers.

## Save Mutation

The save button triggers two parallel mutations:
1. PUT `/orgs/{slug}/dancers/{dancerRosterId}/notes` (or DELETE if notes empty)
2. PUT `/orgs/{slug}/dancers/{dancerRosterId}/rating`

Both use `Promise.allSettled`. On success, invalidate queries and reset dirty state. On partial failure, show a toast error but still reset the field that succeeded. On full failure, keep dirty state so the user can retry.
