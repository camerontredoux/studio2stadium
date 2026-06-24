# Freemium Org Accounts — Design (simplification of Free-Tier Users)

> **Status:** Draft design, mid-brainstorm. Captured so it's on the repo — **needs Cameron's review**
> before we write the implementation plan.
> **Date:** 2026-06-24.
> **Supersedes:** the premium-grant–driven approach in `2026-06-24-free-tier-users-design.md`.
> **Related map:** `ORG_EVENTS_REFERENCE.md` (where org/event code lives).

## 1. Why we're changing it

The shipped "Free-tier Users" feature (PR #31) welded two unrelated concepts together through
`premium_grants`:

1. **Premium entitlement** — who gets full S2S (file video, all profile cards).
2. **Profile visibility tier** — how complete an org-provisioned account's profile looks.

Because org roster uploads issued a `premium_grant`, every org dancer effectively got *premium access
to S2S they never paid us for*, and the visibility tiers had to be re-derived from
`subscriptionSource` everywhere. That's the over-complexity: three states to keep in sync
(`event_rosters.paid` + a grant + `users.limited`), grant-skip logic duplicated across three
insertion points, and a `set-paid` path that revoked **all** active grants globally.

**The decision:** org users are simply **freemium** — no premium grants, ever. Stripe remains the only
path to real premium. Profile visibility becomes a pure function of account origin, not subscription.
This lets us upsell premium to org users (they don't already have it) and stops giving away paid
features.

## 2. The new model

Profile tier is driven by a **single account-origin enum** plus whether the user is a real Stripe
payer. No grants, no `subscriptionSource` cross-referencing for org tiers.

```
profile tier = f(realStripeSubscription?, users.org_account_tier)

users.org_account_tier:
  null        → self-signup / normal user            (standard freemium, unchanged)
  'standard'  → org-provisioned account               (hide additional fields)
  'limited'   → free-tier org, unpaid                 (hide even more)
```

| Who | `org_account_tier` | Stripe? | Profile visibility | Premium |
|---|---|---|---|---|
| Stripe subscriber | (any) | ✅ | Full + Cloudflare file video | ✅ paid us |
| Normal self-signup free user | `null` | ❌ | Standard freemium (unchanged) | ❌ |
| Org-uploaded account *(non-free-tier org, or paid=true on free-tier org)* | `'standard'` | ❌ | Hide additional fields *(today's `org_event` look — minus Submission/Skills/Events, media YouTube-only)* | ❌ no grant |
| Free-tier org, unpaid | `'limited'` | ❌ | Hide even more *(today's `limited` look — hero + Organizations only)* | ❌ no grant |

The **visual rendering of every tier stays identical to today.** Only the *driver* changes: from
"has an active org premium grant" → to "what `org_account_tier` was stamped at account creation."

A real Stripe subscription always wins: an org-provisioned account that later pays via Stripe shows
the full premium experience regardless of its `org_account_tier`.

## 3. State changes

| # | Location | Change |
|---|---|---|
| 1 | `users.org_account_tier` (`apps/backend/app/database/schema/users.ts`) | **NEW.** `null \| 'standard' \| 'limited'` (pg enum or text), nullable, default `null`. Set once at account creation; adjustable via admin `set-paid` for free-tier orgs. **Replaces `users.limited`.** |
| 2 | `event_rosters.paid` (`org-events.ts`) | **KEEP.** Still the CSV signal + admin override. Now it only influences `org_account_tier` at provisioning — it no longer gates any grant. |
| 3 | `organizations.features.freeTierUsers` (JSONB) | **KEEP.** Toggles whether the CSV `paid` column is required and whether unpaid → `'limited'`. |
| 4 | `premium_grants` table + `GetSubscriptionService` grant reading + `SubscribedMiddleware` | **KEEP but dormant for orgs.** The whole grant system stays intact in the codebase for future use; org flows simply **stop creating grants.** |

### Removed: `users.limited`
Migrated into the enum (`limited → 'limited'`) then dropped. One column instead of two-booleans-plus-a-grant.

## 4. Provisioning logic — where `org_account_tier` gets set

Net-new org accounts only. **Existing accounts are never downgraded** (an account that predates the
org keeps its tier — usually `null`).

| Path | File | Rule |
|---|---|---|
| Invite claimed (net-new account) | `modules/orgs/register-dancer/service.ts` | free-tier ON + `paid=false` → `'limited'`; otherwise → `'standard'`. **No grant created.** |
| CSV match (existing S2S account) | `modules/orgs/events/upload-dancers/service.ts` | Do **not** touch `org_account_tier` (don't downgrade pre-existing accounts). **No grant created.** |
| Admin attach (existing account) | `modules/orgs/events/rosters/attach/service.ts` | Do **not** touch tier. **No grant created.** |

Non-free-tier orgs: every net-new org account → `'standard'` (org-uploaded ⇒ hide additional fields).
This preserves today's "org dancers hide extra cards" behavior **without** a grant.

## 5. Admin `set-paid` override (free-tier orgs)

`modules/orgs/events/rosters/set-paid/service.ts` — drastically simplified, **no grant operations**:

- `paid = true`  → if the user's `org_account_tier === 'limited'`, bump to `'standard'`.
- `paid = false` → if `org_account_tier === 'standard'` (and org-provisioned), set `'limited'`.
- Accounts with `org_account_tier === null` (pre-existing / non-org) are left untouched.
- Always update `event_rosters.paid` for display/consistency.

Gone: the global "revoke ALL active grants" blast radius.

## 6. Profile endpoint — `modules/dancers/profile/get-dancer/service.ts`

Return:

```ts
subscribed: status.source === "stripe",   // real premium = Stripe only (org users are freemium)
orgAccountTier: user.org_account_tier,     // null | 'standard' | 'limited'
```

- Drop `subscriptionSource` / `limited` from the **profile-driving** logic (the page reads
  `orgAccountTier` instead).
- `GetSubscriptionService` still exists and still reports grants if any linger, but profile tiers no
  longer depend on it.
- Regenerate frontend types (`pnpm types`, backend running) after the response shape changes.

> **Open item for review:** confirm `subscribed` should be Stripe-only. Any non-org feature currently
> relying on `subscribed` being true for grant-holders needs a look (there should be none once org
> grants stop being created, but verify `SubscribedMiddleware` consumers).

## 7. Profile section visibility — `apps/frontend/src/features/dancer/page.tsx`

**Same matrix as today**, re-driven by `orgAccountTier`:

| Section | Stripe | `'standard'` | `'limited'` | normal free (`null`, no Stripe) |
|---|:--:|:--:|:--:|:--:|
| Hero / header | ✅ | ✅ | ✅ | ✅ |
| Contact / Education *(sidebar)* | ✅ | ✅ | ❌ | ✅ |
| Organizations *(owner-only)* | ✅ | ✅ | ✅ | ✅ |
| About / Achievements / References | ✅ | ✅ | ❌ | ✅ |
| Common Recruiting Submission | ✅ | ❌ | ❌ | ❌ |
| Media Gallery | ✅ | ✅ *(YouTube only)* | ❌ | ✅ |
| Skills | ✅ | ❌ | ❌ | ✅ |
| Events Attending | ✅ | ❌ | ❌ | ❌ |

Derive one tier value at the top of the page from `(subscribed, orgAccountTier)`; keep the existing
`canShow(section, tier)`-style helper.

## 8. Video upload — rewire grant checks to the enum

Logic is unchanged in spirit; only the signal changes from `source === "org_event"` → `orgAccountTier === 'standard'`.

| Tier | File upload (`/videos/tus`, Cloudflare) | YouTube |
|---|:--:|:--:|
| Stripe | ✅ | ✅ |
| `'standard'` | ❌ → YouTube only | ✅ |
| `'limited'` / normal free | ❌ (gallery hidden) | ❌ |

- **Backend** `modules/videos/tus-upload/service.ts`: require real Stripe for file upload (already
  computes Stripe-vs-grant; becomes Stripe-vs-`standard`).
- **Frontend** `components/shared/media-gallery/video-upload-dialog.tsx`: `'standard'` → YouTube tab
  only; Stripe → both.

## 9. CSV / parser (mostly unchanged)

- `paid` column still **required when `freeTierUsers` ON**, ignored when OFF (zero regression for
  existing orgs).
- `csv-parser.ts`, `upload-preview`, `upload-dancers`, frontend `csv-schemas.ts` + `csv-upload-dialog.tsx`:
  keep `paid` parsing/validation. **Remove** the grant-creation branch in `upload-dancers`; map `paid`
  → `event_rosters.paid` and (for net-new accounts) → `org_account_tier`.

## 10. Migration

- Add `users.org_account_tier` (`null | 'standard' | 'limited'`).
- **Backfill (preserve current looks):**
  - `users.limited = true` → `'standard'`? No → **`'limited'`**.
  - users with an active org premium grant (today's `org_event`) → `'standard'`.
  - everyone else → `null`.
- Drop `users.limited`.
- `event_rosters.paid` and `premium_grants` tables stay.
- Follow the worktree drizzle-kit 1.0.0-beta.12 workflow (`db:generate`, trim re-emitted columns,
  verify "No schema changes", `db:push` in dev) — see `ORG_EVENTS_REFERENCE.md` §migration tooling.

## 11. What we are explicitly NOT doing (YAGNI)

- Not deleting `premium_grants` / `GetSubscriptionService` / `SubscribedMiddleware` — kept dormant for
  future use.
- Not changing Stripe subscription flows.
- Not changing the visual design of any profile tier.

## 12. Open questions for Cameron's review

1. **Backfill direction:** should existing org-granted dancers land on `'standard'` (keep their
   current "minus 3 cards" look) — yes, assumed above. Confirm.
2. **`subscribed` = Stripe-only** (§6): confirm nothing outside orgs depended on grant-holders reading
   `subscribed: true`.
3. **Enum vs nullable-text** for `org_account_tier`: pg enum (stricter) vs text (easier to evolve)?
   Recommend pg enum.
4. **Should an existing normal-free user uploaded to a non-free-tier org become `'standard'`?**
   Current assumption: **no** — pre-existing accounts keep `null`; only net-new org-provisioned
   accounts get a tier. Confirm.
5. **Clean up dormant grant rows** in dev, or leave them? (Harmless once profile no longer reads them.)

## 13. Next step

On approval: invoke `writing-plans` to produce the implementation plan (schema + migration →
provisioning/services → profile endpoint → frontend gating → video rewire → backfill → verify).
