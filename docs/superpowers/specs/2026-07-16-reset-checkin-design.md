# Reset Check-In — Design

**Date:** 2026-07-16
**Status:** Approved

## Problem

An org admin running an event has no way to clear check-in for a roster. Once dancers are checked in, the only recourse is toggling each row back individually. This bites during rehearsals and test runs, where an admin checks people in, then needs a clean slate for the real event day.

## Solution

A "Reset check-in" button in the dancer roster page header that clears `checkedInAt` for every roster row on the selected event, behind an alert dialog with an explicit confirmation checkbox.

## Background: how check-in is stored

There is no check-in table. Check-in is a single nullable column on `event_rosters`:

```ts
// apps/backend/app/database/schema/org-events.ts:55
checkedInAt: pg.timestamp({ withTimezone: true }),
```

"Checked in" means `checkedInAt is not null`. Reset therefore means setting the column to `null` — no row deletion.

## Decisions

| Decision | Choice | Reasoning |
|---|---|---|
| Permission | Org admins only | Matches the rest of the admin routes. A destructive bulk action should not share a gate with a single-row toggle. |
| Scope of clear | Set `checkedInAt = null` | Preserves row identity and per-row metadata; recoverable via audit trail. |
| Audit logging | One entry per reset row | Consistent with the existing single-row toggle and bulk-delete services. Preserves per-dancer history. |
| Staff rows | Included in the reset | "Clear all check-in for the event" literally. Excluding them creates a state where staff stay checked in after a reset the admin believes wiped everything. |
| Optimistic update | No — invalidate on success | The action sits behind a confirm dialog where a brief spinner is acceptable. An optimistic path would mean rewriting every cached row rather than applying a ±1 delta. |

## Backend

### Endpoint

`POST /orgs/:slug/events/:id/rosters/check-in/reset`

Registered in `apps/backend/app/modules/orgs/events/routes.ts` alongside the existing roster routes.

Middleware: `[auth(), org(), orgMember(), orgAdmin()]` — the same chain used by `DELETE :slug/events/:id/rosters` (routes.ts:177-184) and the admin single-row toggle (routes.ts:359-368).

No request body, no validator. The event is the scope and it comes from the URL.

### Service

Modeled on `apps/backend/app/modules/orgs/events/rosters/delete/service.ts`.

Inside `this.db.withAudit({ eventId, actorId }, async (tx, auditLog) => ...)`:

1. Select the event's rows where `checkedInAt is not null`, scoped by `eq(eventRosters.eventId, eventId)`. Event-scoping the query is the tenant-safety pattern used throughout this router and is non-negotiable.
2. Update those rows to `checkedInAt: null`.
3. Emit one audit entry per row:
   ```ts
   auditLog.log({
     action: "update",
     resource: "roster",
     resourceId: row.id,
     metadata: { field: "checkedInAt", before: row.checkedInAt, after: null },
   });
   ```

Filtering to non-null rows up front means already-cleared rows generate no audit noise, and it makes the reset count fall out naturally.

### Response

```json
{ "reset": 12 }
```

### Controller

Follows `apps/backend/app/modules/orgs/events/rosters/check-in/controller.ts`. No validator needed. Maps no domain errors — a reset against an event with zero checked-in rows is a success returning `{ reset: 0 }`, not an error.

## Frontend

### Mutation hook

`useResetCheckIn()` added to `apps/frontend/src/features/org/api/check-in-queries.ts`.

That file already bypasses the typed `$api` via a hand-rolled `rawClient` cast, because the OpenAPI spec does not cover the check-in paths. The new endpoint has the same gap, so it uses the same escape hatch rather than introducing a second pattern.

On success, invalidate both cached surfaces (same prefixes the existing `useAdminCheckInToggle` invalidates):

- `["get", "/orgs/{slug}/events/{id}/rosters"]`
- `["get", "/orgs/{slug}/events/{id}/rosters/stats"]`

No `onMutate` / optimistic patching.

### Header button

Lives in `apps/frontend/src/features/org/components/roster-page-header.tsx`, in the `<header>` bar next to the activation widget.

The header is already `flex flex-wrap items-center justify-between gap-x-6 gap-y-3`. The activation widget and the new button must travel together as a unit — otherwise the button wraps out from under its own context and lands next to the title. So the widget and button get wrapped in a shared `flex flex-wrap items-center` container. The button drops to its own line on narrow viewports; the title stays put.

Button properties:

- `variant="ghost"`, small — a rare destructive action that should not compete with the page title.
- Rendered only when `hasFeature("check_in")` is true, matching the gating already applied to the Checked In stat cell (roster-page-header.tsx:97-103).
- Disabled when `stats.checkedIn` is `0` — nothing to reset.

### Dialog

New component `ResetCheckInDialog` in `apps/frontend/src/features/org/components/`, built on the existing BaseUI `AlertDialog` primitives (`components/ui/alert-dialog.tsx`). Follows the bulk-delete confirm at `features/org/components/data-grid.tsx:753-781`, including the BaseUI `render={<Button variant="ghost" />}` polymorphic prop (not `asChild`).

State: one piece of local `useState` for the confirmation checkbox. It is frontend-only and exists solely to gate the destructive button's `disabled`. The checkbox resets to unchecked whenever the dialog opens, so a second reset cannot inherit a stale checked state.

Copy names the event and the count:

> **Reset check-in**
> This will clear check-in for all {N} checked-in dancers in {event name}. They will need to check in again.
> [ ] I understand this will clear all check-in records for this event.
> (Cancel) (Reset check-in)

## Testing

**Backend service test:**

- Reset clears `checkedInAt` on the event's checked-in rows, returns the correct count, and emits one audit entry per row.
- Event-scoping: rows belonging to a *different* event are untouched. This is the test that actually matters.
- Reset against an event with zero checked-in rows returns `{ reset: 0 }` and emits no audit entries.

**Frontend test:**

- The dialog's confirm button is disabled until the checkbox is checked.
- The checkbox resets to unchecked when the dialog is reopened.

## Out of scope

- Undo / restore of a reset (the audit trail records prior values, but no UI reads it).
- Resetting check-in for a subset of the roster — the bulk-delete flow already covers per-row selection if that need arises.
- Adding the check-in paths to the OpenAPI spec. Worth doing, but it is a separate cleanup that would touch the existing hooks too.
