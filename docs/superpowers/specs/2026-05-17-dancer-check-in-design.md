# Dancer Check-In Feature — Design Spec

## Overview

Build a dancer check-in system tied to event start time. Dancers can check in from their dashboard once the event begins. Check-in status is visible to admins and gates coach scouting visibility — only checked-in, active dancers appear in the scouting tool after the event starts.

## Database Changes

### `org_events` table — add start time + timezone

| Column     | Type   | Nullable | Default | Notes                                      |
|------------|--------|----------|---------|---------------------------------------------|
| `startTime`| `time` | yes      | NULL    | Local event start time, e.g. `"09:00"`      |
| `timezone` | `text` | yes      | NULL    | IANA timezone identifier, e.g. `"America/New_York"` |

- Existing `startDate`/`endDate` DATE columns remain unchanged.
- The triple `startDate + startTime + timezone` defines the exact UTC moment check-in opens.
- Both columns are nullable so existing events without a start time still function — check-in is simply disabled for those events.
- `startTime` and `timezone` must be provided together or not at all. Backend validates this constraint on create/update.

### `event_rosters` table — add check-in tracking

| Column       | Type                       | Nullable | Default | Notes                                    |
|--------------|----------------------------|----------|---------|------------------------------------------|
| `checkedInAt`| `timestamp with timezone`  | yes      | NULL    | NULL = not checked in; non-null = checked in at that UTC moment |

No new tables or enums.

## Backend API

### Event creation/update — accept new fields

- Update create and update validators to accept optional `startTime` (HH:mm regex) and `timezone` (validated against IANA list).
- Store as-is — no UTC conversion. The local time + timezone pair is stored separately.

### Dancer self check-in

**`POST /orgs/:slug/events/:eventId/check-in`**

- Middleware: `auth → org → orgEvent → orgMember`
- Validates:
  - Event has `startTime` + `timezone` set
  - Current UTC time >= event start moment (computed from `startDate + startTime + timezone`)
  - Caller is a dancer on this event's roster
- Sets `checkedInAt = now()` on the caller's roster entry
- Idempotent: if already checked in, returns success without overwriting the timestamp
- Returns the updated roster entry

### Admin check-in toggle

**`POST /orgs/:slug/events/:eventId/rosters/:rosterId/check-in`**

- Middleware: `auth → org → orgEvent → orgAdmin`
- Toggles: NULL → `now()`, non-null → NULL
- No time gate — admins can check in dancers at any time
- Logs to `event_audit_log` (action: `"update"`, resource: `"roster"`)
- Returns the updated roster entry

### Check-in status (dancer dashboard)

**`GET /orgs/:slug/events/:eventId/check-in/status`**

- Middleware: `auth → org → orgEvent → orgMember`
- Returns:
  ```json
  {
    "checkedInAt": "2026-05-17T09:01:23Z" | null,
    "eventStartTime": "09:00" | null,
    "timezone": "America/New_York" | null,
    "canCheckIn": true | false
  }
  ```
- `canCheckIn` is true when: startTime + timezone are set, current time >= event start, and dancer hasn't checked in yet.

### Coach scouting filter — `ListDancersService`

- Compute whether the event has started using `startDate + startTime + timezone`.
- If event has started: add `WHERE checkedInAt IS NOT NULL AND userId IS NOT NULL` (checked-in + active).
- If event hasn't started or no startTime is set: current behavior (all dancers with `type = 'dancer'`).

## Admin Dashboard Changes

### Event form — new fields

- Add a time picker input for "Event Start Time" (HH:mm) below the date range picker.
- Add a searchable timezone select dropdown below the time picker. Common US timezones surfaced at the top, full IANA list available.
- Both fields are optional. On edit, pre-populated from event data.

### Dancer list — "Checked In" column

- New column after the existing "Status" column.
- Header: "Checked In".
- Renders a `StatusBadge`-style indicator: green dot + "Yes" when `checkedInAt` is non-null, muted dot + "No" when null.
- Clicking the badge toggles check-in status (calls admin check-in endpoint).
- Also available in `RosterDetailSheet` as an explicit "Check In" / "Undo Check-in" button.
- Column is hideable.

### Stats header — check-in count

- Add a stat pill: "Checked In: X/Y" alongside existing "Active" and "Pending" counts, where Y is the total active (registered) dancers.
- Only visible when the event has a start time configured.

## Coach Scouting Tool Changes

- No new UI elements. Filtering is server-side and invisible to coaches.
- Before event starts: coaches see all active dancers (current behavior).
- After event starts: API returns only checked-in + active dancers. Existing filters (year, GPA, state, favorites, etc.) work on top of this base set.
- Mid-session event transition: next data refetch (search, filter, pagination) reflects the filtered set. No real-time push needed.

## Dancer Dashboard Changes

### New `/dancer/event-info` page

- Becomes the default landing page (redirect updated from `/dancer/video-library`).
- Added to dancer sidebar nav in Overview section (above Video Library) with CalendarIcon.

### Page content

- **Event header:** Event name, date range, venue name + address.
- **Schedule PDF:** Link if `schedulePdfUrl` is set.
- **Check-in card:** Prominent interactive card:
  - **Before event start:** "Check-in opens at [time] [timezone]" with disabled button.
  - **At/after event start, not checked in:** Enabled primary "Check In" button.
  - **After check-in:** Green checkmark, "Checked in at [time]", button replaced with confirmation.

### Time comparison logic

- Construct event start moment from `startDate + startTime + timezone`.
- Compare against current UTC time.
- Timezone-correct: a dancer in a different timezone than the event gets the correct gate.

## Out of Scope

- Real-time push notifications when check-in opens
- Check-in QR codes or geofencing
- Check-in history/undo history (audit log covers admin actions)
- Bulk check-in (admin checks in one at a time, or dancers self-serve)
