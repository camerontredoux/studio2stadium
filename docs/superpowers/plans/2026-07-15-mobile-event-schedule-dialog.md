# Mobile Event Schedule Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PDF and image event schedules render in a viewport-bounded, scrollable mobile dialog for admin, coach, and dancer views.

**Architecture:** Move the duplicated expanded-dialog markup into one shared `EventScheduleDialog` component. Keep the global dialog primitive unchanged; the shared component owns a fixed mobile viewport height, a non-scrolling header, and a flexible overflow region, while retaining the current desktop sizing.

**Tech Stack:** React 19, TypeScript, Base UI dialog primitives, Tailwind CSS 4, Vitest.

## Global Constraints

- Preserve the existing desktop event schedule presentation.
- Apply the fix to admin, coach, and dancer views.
- Do not change upload, removal, URL generation, inline previews, or the global dialog primitive.
- Reuse existing dialog primitives and theme/spacing tokens.

---

### Task 1: Shared responsive event schedule dialog

**Files:**
- Create: `apps/frontend/src/components/event-schedule-dialog.tsx`
- Create: `apps/frontend/src/components/event-schedule-dialog.spec.ts`

**Interfaces:**
- Consumes: `open: boolean`, `onOpenChange: (open: boolean) => void`, `fileUrl: string`, and `isPdf: boolean`.
- Produces: `EventScheduleDialog`, which renders the common expanded PDF/image schedule UI.

- [ ] **Step 1: Write a failing contract test**

Create a focused Vitest test that imports the exported dialog layout class constants and asserts that the popup is viewport-bounded, the content region can shrink and scroll, and the desktop preview retains an `80vh` height.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm --filter frontend exec vitest run src/components/event-schedule-dialog.spec.ts`

Expected: FAIL because `event-schedule-dialog.tsx` and its layout contract do not exist.

- [ ] **Step 3: Implement the shared component**

Create `EventScheduleDialog` with the existing `Dialog`, `DialogContent`, `DialogHeader`, and `DialogTitle` primitives. Use a mobile popup height bounded by `100svh` minus the viewport padding, keep the header shrink-free, and render the iframe/image inside a `min-h-0 flex-1 overflow-auto` content region. At `sm` and above, preserve the existing `80vh` preview height and `max-w-5xl` width.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `pnpm --filter frontend exec vitest run src/components/event-schedule-dialog.spec.ts`

Expected: PASS with one test file and no failures.

### Task 2: Replace all duplicated expanded schedule dialogs

**Files:**
- Modify: `apps/frontend/src/routes/_org/o/$orgSlug/_authenticated/admin/index.tsx`
- Modify: `apps/frontend/src/routes/_org/o/$orgSlug/_authenticated/coach/event-info.tsx`
- Modify: `apps/frontend/src/routes/_org/o/$orgSlug/_authenticated/dancer/event-info.tsx`

**Interfaces:**
- Consumes: `EventScheduleDialog` from Task 1.
- Produces: identical expanded-dialog behavior in all three role views.

- [ ] **Step 1: Replace each duplicated dialog block**

Import `EventScheduleDialog` from `@/components/event-schedule-dialog` and replace each expanded `Dialog` block with the shared component, passing the existing open state, setter, URL, and PDF flag. Remove dialog imports that become unused. Leave inline previews and admin upload/removal behavior unchanged.

- [ ] **Step 2: Format only changed implementation files**

Run: `pnpm exec prettier --write apps/frontend/src/components/event-schedule-dialog.tsx apps/frontend/src/components/event-schedule-dialog.spec.ts 'apps/frontend/src/routes/_org/o/$orgSlug/_authenticated/admin/index.tsx' 'apps/frontend/src/routes/_org/o/$orgSlug/_authenticated/coach/event-info.tsx' 'apps/frontend/src/routes/_org/o/$orgSlug/_authenticated/dancer/event-info.tsx'`

- [ ] **Step 3: Run focused and package verification**

Run:

```bash
pnpm --filter frontend exec vitest run src/components/event-schedule-dialog.spec.ts
pnpm --filter frontend lint
pnpm --filter frontend build
```

Expected: all commands exit 0 with no test failures, lint errors, or TypeScript/build errors.

- [ ] **Step 4: Verify responsive behavior in the browser**

Open the event schedule as admin, coach, and dancer at a mobile viewport. Confirm the schedule renders, the content region scrolls, and the header/close control remain accessible. Check one desktop viewport to confirm the existing wide presentation remains intact.

- [ ] **Step 5: Review and commit the scoped change**

Inspect `git diff` and ensure the commit includes only the new shared component/test, the three integrations, and this plan. Commit with `fix(org): make event schedule dialog scroll on mobile`.
