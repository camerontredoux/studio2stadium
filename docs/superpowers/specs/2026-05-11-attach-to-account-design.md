# Attach to Account — Design Spec

## Problem

When an admin uploads a dancer CSV with the wrong email (or a parent's email), the current fix requires changing the email and resending the invite — forcing the dancer or parent to act. If the dancer already has an account under a different email, there's no way to link the roster entry to that existing account without the end user's involvement.

## Solution

Add an "Attach to Account" action to the admin's roster detail sheet that lets the admin search for and link a roster entry to any existing user account on the platform. This is a zero-friction fix — the dancer doesn't need to do anything.

## UI Flow

### Button Placement

A styled action card appears below the email field in `RosterDetailSheet`:

- **Pending dancers** (`userId` is null): "Attach to Account" — "Link this roster entry to an existing user"
- **Registered dancers** (`userId` is set): "Change Account" — "Link to a different user account"

The button is visible for dancer-type roster entries only.

### Search Dialog

Clicking the button opens a `Dialog` on top of the sheet:

- **Title**: "Attach to Account" (or "Change Account" for registered dancers)
- **Description**: "Search for an existing user to link to this roster entry. The roster email and name will update to match the selected account."
- **Search input**: Debounced (300ms), searches by name or email
- **Results list**: Up to 20 results. Each row shows avatar, full name, and email. Click to select (highlighted with blue left border). Click again to deselect.
- **Footer**: Cancel and Attach/Change buttons. Attach is disabled until a user is selected.

### Post-Attach Behavior

- Dialog closes
- Roster list query invalidated (table refreshes, status flips to Active)
- Roster detail data refreshes in the sheet (updated email, name, Active badge)
- Success toast: "Account attached" / "Account changed"
- Button label switches to "Change Account"

## Backend API

### `GET /orgs/:slug/users/search?q=...`

Search all platform users by name or email.

- **Auth**: Admin only (org admin for this org)
- **Query params**: `q` (string, required, min 2 chars)
- **Response**: Array of up to 20 matches:
  ```
  {
    id: string
    email: string
    firstName: string
    lastName: string
    profilePhotoUrl: string | null
    username: string | null
  }
  ```
- **Search logic**: Case-insensitive partial match on `email`, `firstName`, or `lastName` using SQL `ILIKE`
- **Filter**: Only users with `account_type = 'dancer'`

### `POST /orgs/:slug/events/:eventId/rosters/:rosterId/attach`

Attach a roster entry to an existing user account.

- **Auth**: Admin only
- **Body**: `{ userId: string }`
- **Validation**:
  1. `userId` must reference an existing user with `account_type = 'dancer'`
  2. No other roster entry on this event may already have this `userId` (error: "This user already has a roster entry for this event")
  3. Roster entry must be of type `dancer`

- **Transaction** (all-or-nothing):
  1. Update `eventRosters`: set `userId`, update `email`, `firstName`, `lastName` from the user record
  2. Upsert `orgMemberships`: `(userId, orgId, type: 'dancer')` — ON CONFLICT DO NOTHING
  3. Upsert `premiumGrants`: `(userId, sourceType: 'org_event', sourceId: eventId, expiresAt: event.endDate + org.settings.premium_period_days)` — ON CONFLICT DO NOTHING
  4. Consume pending `dancerInvites`: `SET consumedAt = now() WHERE email = <old_roster_email> AND orgId = org.id AND consumedAt IS NULL`

- **Response**: Updated roster entry (same shape as existing roster endpoints)

### Change Account (re-link) behavior

When the roster entry already has a `userId` (the "Change Account" case):

- The old user's `orgMembership` and `premiumGrant` are NOT revoked — those were earned independently
- The old `userId` is simply replaced with the new one
- Same transaction steps apply for the new user

## Side Effects

**What happens:**
- Roster entry gets `userId`, updated email/name
- User gains org membership and premium access (if not already present)
- Pending invite for old email is consumed

**What does NOT happen:**
- No email notification to the dancer
- No changes to the user's global `dancerProfiles`
- No changes to scouting data (favorites, ratings, notes, callbacks) — these are tied to `rosterId`, not `userId`

## File Locations

### Backend (new files)
- `apps/backend/app/modules/orgs/events/rosters/attach/controller.ts`
- `apps/backend/app/modules/orgs/events/rosters/attach/service.ts`
- `apps/backend/app/modules/orgs/events/rosters/attach/validator.ts`
- `apps/backend/app/modules/orgs/users/search/controller.ts`
- `apps/backend/app/modules/orgs/users/search/service.ts`
- `apps/backend/app/modules/orgs/users/search/validator.ts`

### Backend (modified files)
- `apps/backend/app/modules/orgs/events/routes.ts` — register attach route
- `apps/backend/app/modules/orgs/routes.ts` — register user search route (if org-level routing exists)

### Frontend (new files)
- `apps/frontend/src/features/org/components/attach-account-dialog.tsx`

### Frontend (modified files)
- `apps/frontend/src/features/org/components/roster-detail-sheet.tsx` — add attach button + dialog trigger
- `apps/frontend/src/features/org/api/roster-queries.ts` — add attach mutation, user search query

## Error States

| Scenario | Behavior |
|----------|----------|
| Search returns no results | Show "No users found" empty state in dialog |
| Selected user already on this roster | Error toast: "This user already has a roster entry for this event" |
| Network error during attach | Error toast: "Failed to attach account. Please try again." |
| Roster entry is a coach | Button not rendered (dancer-only feature) |
