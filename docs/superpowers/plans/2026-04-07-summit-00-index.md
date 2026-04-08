# Summit Multi-Tenant Org Platform — Plan Index

**Source spec:** `docs/superpowers/specs/2026-04-01-multi-tenant-org-platform-design.md`
**Created:** 2026-04-07
**Target event:** The Summit, June 13, 2026 (profile blast May 22, 2026)

The spec covers many independent subsystems. It has been split into seven sub-plans, each of which produces working, testable software on its own. Plans must be executed in order — each depends on the tables/middleware/components created by earlier plans.

## Dependency Order

```
Plan 1: Foundation (data model + premium grants)
   │
   ├─► Plan 2: Org routing, middleware, branded shell
   │      │
   │      └─► Plan 3: Events + rosters + CSV upload + admin dashboard
   │             │
   │             ├─► Plan 4: Coach scouting (favorites, notes, ratings, search)
   │             ├─► Plan 5: Dancer profile + school selections (privacy-critical)
   │             ├─► Plan 6: Video library (+ optional assignment feature)
   │             └─► Plan 7: Callbacks (feature-gated)
```

Plans 4–7 can be parallelized once Plan 3 has shipped.

## Sub-Plans

| # | File | Ships |
|---|---|---|
| 1 | [01-foundation.md](./2026-04-07-summit-01-foundation.md) | `organizations`, `org_memberships`, `premium_grants` tables; additive migration; updated premium check; everything else keeps working. **Status: Tasks 1-8 shipped.** Task 9 (destructive cleanup) deferred to Plan 01b below. |
| 1b | [01b-legacy-cleanup.md](./2026-04-07-summit-01b-legacy-cleanup.md) | Refactor every live callsite off `platformName`/`user_platforms`/`prodigy_admin`, then drop them. Not a blocker for Plans 02–07. |
| 2 | [02-org-shell.md](./2026-04-07-summit-02-org-shell.md) | `/orgs/:slug` public endpoint, org middleware stack, branded login/registration, `OrgProvider` with CSS-variable theming |
| 3 | [03-events-rosters-csv.md](./2026-04-07-summit-03-events-rosters-csv.md) | `org_events`, `event_rosters`, `event_dancer_profiles`, `csv_uploads`; admin event CRUD; coach + dancer CSV flows with invite emails and premium grant wiring; admin stats dashboard |
| 4 | [04-coach-scouting.md](./2026-04-07-summit-04-coach-scouting.md) | `event_favorites`, `event_notes`, `event_ratings`; dancer search/profile; favorites/notes/rating endpoints + UI; bib quick-jump; rankings |
| 5 | [05-dancer-profile-selections.md](./2026-04-07-summit-05-dancer-profile-selections.md) | `event_school_selections` with tri-level privacy; dancer profile edit; school picker with reassurance UX |
| 6 | [06-video-library.md](./2026-04-07-summit-06-video-library.md) | `event_videos`, `event_video_assignments`; admin video CRUD; coach/dancer viewing with feature gating |
| 7 | [07-callbacks.md](./2026-04-07-summit-07-callbacks.md) | `event_callbacks`; coach callback UI + admin aggregation dashboard; feature-gated |

## Global UX Concerns (applied across all plans)

The spec is data-model-first and under-specifies UX dimensions. These concerns are applied to every plan where relevant:

1. **Mobile-first is mandatory.** Event happens IRL in a loud venue. Coaches on phones need large tap targets and scan-at-arm's-length type. Every interactive screen is designed mobile-first, desktop second.
2. **Empty / loading / error / success states are first-class.** Each feature task includes explicit state design, not an afterthought.
3. **Feature gating is invisible, not disabled.** Gated routes 404. Gated UI never renders. No "upgrade to unlock" teasers for features that don't exist for an org.
4. **Autosave everything users type.** Notes and profile edits persist on blur + interval, never on navigate-away.
5. **Privacy-critical features get reassurance copy in-UI**, not just docs. School selections especially.
6. **Offline resilience at venue** — queries cached, writes retried, optimistic UI for favorites/callbacks.
7. **Post-grant expiry must degrade gracefully** — banners before, clear "your access has ended" state after, no "upgrade" nag walls.

## Conventions (all plans)

- **Backend pattern:** Adonis 6 module (`app/modules/{domain}/{feature}/{controller,service,validator}.ts`) + `routes.ts` at domain level, registered in `start/routes.ts`.
- **Schema:** Drizzle in `app/database/schema/*.ts`, barrel-exported from `index.ts`, enums centralized in `enums.ts`.
- **Migrations:** `pnpm db:generate` to produce SQL, hand-edit for data migrations, `pnpm db:migrate` to apply.
- **Tests:** Japa functional tests co-located as `*.test.ts`; use `client` from the test context; clean up affected tables in `group.each.setup`.
- **Frontend pattern:** TanStack Router file-based routes, feature modules in `src/features/{feature}/`, shared lib in `src/lib/`, typed API via `$api` from `openapi-react-query`.
- **After backend changes, always run:** `pnpm typecheck && pnpm make:docs` to regenerate OpenAPI + frontend types.
- **TDD discipline:** every task writes a failing test first, implements the minimum, confirms green, commits. No step is skipped for speed.

## Execution

Each plan has a `REQUIRED SUB-SKILL: superpowers:subagent-driven-development` header. Plans are self-contained — a fresh agent given one plan and the spec has everything needed to ship it.
