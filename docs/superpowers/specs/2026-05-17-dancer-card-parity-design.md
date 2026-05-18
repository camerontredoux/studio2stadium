# Dancer Card Parity & Prominent Profile Link

**Date:** 2026-05-17
**Status:** Approved

## Problem

The DancerCard (mobile/card view) is display-only — coaches can't favorite, rate, add notes, toggle callbacks, or visit a dancer's profile without first opening the DancerSheet. The "Visit Profile" link is buried inside the sheet header, which is hard for less tech-savvy coaches to find. The table view also lacks a direct profile link.

## Decisions

- Card body tap: removed (no body-level click handler). Every action is an explicit button.
- Profile link on card: primary button at bottom of card, only rendered when dancer is registered and has a username.
- Action bar on card: single horizontal row — favorite toggle, interactive rating stars, callback pill (conditional on feature flag), notes icon button.
- Profile link on table: name column text becomes a `<Link>` to `/$username`. No row-level click exists, so no stopPropagation needed.
- Card selection: not added. Bulk operations (multi-select) remain table-only.

## Changes

### Backend

Add `username: string | null` to the `/orgs/{slug}/dancers` list endpoint response. The field already exists on the dancer detail endpoint; this surfaces it in the list query so cards and table rows can link to profiles without a detail fetch.

### Frontend — `columns.tsx`

New factory function `nameWithProfileColumn()` that accepts no arguments and returns a `ColumnDef<SearchDancerRow & { username?: string | null }>`. Renders the dancer name as:
- A `<Link to="/$username" params={{ username }}>` in indigo text when `username` is truthy
- Plain text (identical to current `nameColumn`) when `username` is null/undefined

### Frontend — `dancer-card.tsx`

Structural changes:
- Root element changes from `<button>` to `<div>` (no body click)
- Props expand to accept action callbacks and username

New props:
```ts
interface DancerCardProps {
  dancer: SearchDancerRow & { username?: string | null };
  onFavoriteToggle: (rosterId: string, current: boolean) => void;
  onRate: (rosterId: string, rating: number) => void;
  onOpenNotes: (rosterId: string) => void;
  onCallbackToggle?: (rosterId: string, current: boolean) => void;
}
```

Layout (top to bottom):
1. **Header row:** bib number (left), school interest star (right)
2. **Name:** first + last name
3. **Meta:** grad year · studio · GPA
4. **Action bar:** heart toggle | interactive star rating | callback pill (if `onCallbackToggle` provided) | notes pencil/plus icon
5. **Profile button:** full-width outline `<Link>` button, text "Visit Profile →", only rendered when `dancer.username` is truthy

Action bar components reuse the same UI patterns as the table columns:
- Heart icon toggles filled red / muted outline
- Rating uses the existing `<Rating>` + `<RatingItem>` components in interactive mode
- Callback uses the megaphone pill toggle pattern from `callbackToggleColumn`
- Notes shows pencil icon if note exists, plus icon if not

### Frontend — `use-dancer-columns.ts`

Swap `nameColumn` for the new `nameWithProfileColumn()` in the `useSearchColumns` hook. Since the hook already operates on `SearchDancerRow`, extending it with `username` is type-compatible.

### Frontend — `index.tsx` (page component)

- `filteredData` mapping: carry `username` through from the API response (once backend adds it)
- `renderCard` prop: pass `onFavoriteToggle`, `onRate`, `onOpenNotes`, and conditionally `onCallbackToggle` to `DancerCard` instead of a single `onClick`
- Remove the `onClick={() => setSheetRosterId(row.rosterId)}` from the card — card no longer opens the sheet on body tap

### No changes

- `DancerSheet` — already has the profile link in the header
- `DancerTable` — generic component, just renders what columns and renderCard give it
- `FloatingActionBar` — only used with table selection, which cards don't participate in
- Sidebar components — no changes needed
