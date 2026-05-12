# Attach to Account Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins link a dancer roster entry to an existing user account without requiring the dancer to act.

**Architecture:** Two new backend endpoints (attach + search) following the existing reconciliation module pattern. One new frontend dialog component integrated into the existing RosterDetailSheet. The backend `manualMerge` in `reconciliation/service.ts` is the closest precedent — our attach service extends that pattern with name/email sync, premium grants, and re-link support.

**Tech Stack:** AdonisJS 6, Drizzle ORM, VineJS, React 19, TanStack Query, openapi-react-query, Base UI Dialog

**Spec:** `docs/superpowers/specs/2026-05-11-attach-to-account-design.md`

---

## File Map

### Backend (new)
| File | Responsibility |
|------|----------------|
| `apps/backend/app/modules/orgs/events/rosters/attach/validator.ts` | VineJS schema for attach body (`targetUserId`) |
| `apps/backend/app/modules/orgs/events/rosters/attach/service.ts` | Business logic: attach transaction + dancer user search |
| `apps/backend/app/modules/orgs/events/rosters/attach/controller.ts` | HTTP handler for `POST .../rosters/:rosterId/attach` |
| `apps/backend/app/modules/orgs/events/rosters/attach/search-controller.ts` | HTTP handler for `GET .../rosters/search-dancers` |

### Backend (modified)
| File | Change |
|------|--------|
| `apps/backend/app/modules/orgs/events/routes.ts` | Register two new routes |

### Frontend (new)
| File | Responsibility |
|------|----------------|
| `apps/frontend/src/features/org/components/attach-account-dialog.tsx` | Search dialog: input, results list, select, confirm |

### Frontend (modified)
| File | Change |
|------|--------|
| `apps/frontend/src/features/org/api/roster-queries.ts` | Add `useAttachAccount` mutation + `useSearchDancerUsers` query |
| `apps/frontend/src/features/org/components/roster-detail-sheet.tsx` | Add attach/change button + wire dialog |

---

## Task 1: Backend — Validator

**Files:**
- Create: `apps/backend/app/modules/orgs/events/rosters/attach/validator.ts`

- [ ] **Step 1: Create the validator**

```typescript
// apps/backend/app/modules/orgs/events/rosters/attach/validator.ts
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const attachSchema = vine.compile(
  vine.object({
    targetUserId: vine.string().uuid(),
  })
);

export type AttachValidator = Infer<typeof attachSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/app/modules/orgs/events/rosters/attach/validator.ts
git commit -m "feat(roster): add attach-to-account validator"
```

---

## Task 2: Backend — Service

**Files:**
- Create: `apps/backend/app/modules/orgs/events/rosters/attach/service.ts`

This service has two methods: `attach()` (transactional link) and `searchDancerUsers()` (user search). Follows the `reconciliation/service.ts` pattern closely, extended with name/email sync, premium grants, and dancer invite consumption.

- [ ] **Step 1: Create the service**

```typescript
// apps/backend/app/modules/orgs/events/rosters/attach/service.ts
import { DatabaseService } from "#database/service";
import {
  dancerInvites,
  orgMemberships,
  premiumGrants,
  organizations,
} from "#database/schema/organizations";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { users } from "#database/schema/users";
import { inject } from "@adonisjs/core";
import { and, eq, isNull, ne, sql } from "drizzle-orm";

export class RosterNotFoundError extends Error {
  code = "ROSTER_NOT_FOUND" as const;
  constructor() {
    super("Roster entry not found.");
  }
}

export class UserNotFoundError extends Error {
  code = "USER_NOT_FOUND" as const;
  constructor() {
    super("User not found or is not a dancer account.");
  }
}

export class DuplicateRosterError extends Error {
  code = "DUPLICATE_ROSTER" as const;
  constructor() {
    super("This user already has a roster entry for this event.");
  }
}

@inject()
export class AttachAccountService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async attach(
    eventId: string,
    rosterId: string,
    targetUserId: string,
    actorId: string
  ) {
    // Validate target user exists and is a dancer
    const [targetUser] = await this.db.use((db) =>
      db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(and(eq(users.id, targetUserId), eq(users.type, "dancer")))
        .limit(1)
    );
    if (!targetUser) throw new UserNotFoundError();

    // Check no other roster entry on this event already has this userId
    const [duplicate] = await this.db.use((db) =>
      db
        .select({ id: eventRosters.id })
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.userId, targetUserId),
            ne(eventRosters.id, rosterId)
          )
        )
        .limit(1)
    );
    if (duplicate) throw new DuplicateRosterError();

    return this.db.withAudit({ eventId, actorId }, async (tx, audit) => {
      // Lock and fetch the roster entry
      const [roster] = await tx
        .select()
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.id, rosterId),
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.type, "dancer")
          )
        )
        .for("update");
      if (!roster) throw new RosterNotFoundError();

      const oldEmail = roster.email;

      // Update roster entry with user's data
      await tx
        .update(eventRosters)
        .set({
          userId: targetUserId,
          email: targetUser.email,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
        })
        .where(eq(eventRosters.id, rosterId));

      // Resolve orgId from event
      const [event] = await tx
        .select({
          orgId: orgEvents.orgId,
          endDate: orgEvents.endDate,
        })
        .from(orgEvents)
        .where(eq(orgEvents.id, eventId))
        .limit(1);

      if (event?.orgId) {
        const orgId = event.orgId;

        // Upsert org membership
        await tx
          .insert(orgMemberships)
          .values({
            userId: targetUserId,
            orgId,
            type: "dancer",
            role: "member",
          })
          .onConflictDoNothing({
            target: [orgMemberships.userId, orgMemberships.orgId],
          });

        // Calculate premium grant expiry
        const [org] = await tx
          .select({ settings: organizations.settings })
          .from(organizations)
          .where(eq(organizations.id, orgId))
          .limit(1);

        const settings =
          (org?.settings as { premium_period_days?: number }) ?? {};
        const periodDays = settings.premium_period_days ?? 90;
        const eventEndDate = new Date(
          (event.endDate as string) + "T00:00:00Z"
        );
        const grantExpires = new Date(eventEndDate);
        grantExpires.setDate(grantExpires.getDate() + periodDays);

        // Upsert premium grant
        await tx
          .insert(premiumGrants)
          .values({
            userId: targetUserId,
            sourceType: "org_event",
            sourceId: eventId,
            expiresAt: grantExpires,
          })
          .onConflictDoNothing();

        // Consume pending dancer invites for the old email
        await tx
          .update(dancerInvites)
          .set({ consumedAt: new Date() })
          .where(
            and(
              eq(dancerInvites.orgId, orgId),
              eq(dancerInvites.email, oldEmail),
              isNull(dancerInvites.consumedAt)
            )
          );
      }

      audit.log({
        action: "activate",
        resource: "roster",
        resourceId: rosterId,
        metadata: {
          type: "attach_to_account",
          targetUserId,
          previousEmail: oldEmail,
          newEmail: targetUser.email,
        },
      });

      // Refetch updated roster for response
      const [updated] = await tx
        .select({
          id: eventRosters.id,
          eventId: eventRosters.eventId,
          type: eventRosters.type,
          email: eventRosters.email,
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
          bibNumber: eventRosters.bibNumber,
          organization: eventRosters.organization,
          isRegistered: sql<boolean>`(${eventRosters.userId} IS NOT NULL)`,
          createdAt: eventRosters.createdAt,
        })
        .from(eventRosters)
        .where(eq(eventRosters.id, rosterId));

      return updated;
    });
  }

  async searchDancerUsers(query: string) {
    if (query.length < 2) return [];

    const term = `%${query.toLowerCase()}%`;

    return this.db.use((db) =>
      db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          avatar: users.avatar,
          username: users.username,
        })
        .from(users)
        .where(
          and(
            eq(users.type, "dancer"),
            sql`(lower(${users.email}) like ${term} OR lower(${users.firstName}) like ${term} OR lower(${users.lastName}) like ${term})`
          )
        )
        .limit(20)
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/app/modules/orgs/events/rosters/attach/service.ts
git commit -m "feat(roster): add attach-to-account service with search"
```

---

## Task 3: Backend — Controllers

**Files:**
- Create: `apps/backend/app/modules/orgs/events/rosters/attach/controller.ts`
- Create: `apps/backend/app/modules/orgs/events/rosters/attach/search-controller.ts`

- [ ] **Step 1: Create the attach controller**

```typescript
// apps/backend/app/modules/orgs/events/rosters/attach/controller.ts
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import {
  AttachAccountService,
  DuplicateRosterError,
  RosterNotFoundError,
  UserNotFoundError,
} from "./service.ts";
import { attachSchema } from "./validator.ts";

export default class AttachAccountController {
  @inject()
  async handle(ctx: HttpContext, service: AttachAccountService) {
    const payload = await ctx.request.validateUsing(attachSchema);
    const user = ctx.auth.getUserOrFail();

    try {
      const result = await service.attach(
        ctx.params.id,
        ctx.params.rosterId,
        payload.targetUserId,
        user.id
      );
      return ctx.response.ok(result);
    } catch (err) {
      if (err instanceof RosterNotFoundError) {
        return ctx.response.notFound({ code: err.code, message: err.message });
      }
      if (err instanceof UserNotFoundError) {
        return ctx.response.notFound({ code: err.code, message: err.message });
      }
      if (err instanceof DuplicateRosterError) {
        return ctx.response.conflict({ code: err.code, message: err.message });
      }
      throw err;
    }
  }
}
```

- [ ] **Step 2: Create the search controller**

```typescript
// apps/backend/app/modules/orgs/events/rosters/attach/search-controller.ts
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { AttachAccountService } from "./service.ts";

export default class SearchDancerUsersController {
  @inject()
  async handle({ request, response }: HttpContext, service: AttachAccountService) {
    const q = request.input("q", "") as string;
    const results = await service.searchDancerUsers(q);
    return response.ok(results);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/app/modules/orgs/events/rosters/attach/controller.ts apps/backend/app/modules/orgs/events/rosters/attach/search-controller.ts
git commit -m "feat(roster): add attach and search controllers"
```

---

## Task 4: Backend — Route Registration

**Files:**
- Modify: `apps/backend/app/modules/orgs/events/routes.ts`

- [ ] **Step 1: Register the new routes**

Add these two lazy controller imports at the top of the file, alongside the existing roster controller imports:

```typescript
const AttachAccountController = () =>
  import("./rosters/attach/controller.ts");
const SearchDancerUsersController = () =>
  import("./rosters/attach/search-controller.ts");
```

Add these two route registrations inside the `router.group()` block, after the existing `resend-invites` route (around line 163):

```typescript
    router
      .post(":slug/events/:id/rosters/:rosterId/attach", [
        AttachAccountController,
      ])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
    router
      .get(":slug/events/:id/rosters/search-dancers", [
        SearchDancerUsersController,
      ])
      .use([
        middleware.auth(),
        middleware.org(),
        middleware.orgMember(),
        middleware.orgAdmin(),
      ]);
```

- [ ] **Step 2: Verify the backend compiles**

```bash
cd apps/backend && pnpm typecheck
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/app/modules/orgs/events/routes.ts
git commit -m "feat(roster): register attach and search-dancers routes"
```

---

## Task 5: Regenerate API Types

**Files:**
- Modified by codegen: `apps/frontend/src/lib/api/types.d.ts`

The frontend uses auto-generated types from the backend OpenAPI spec. We need to regenerate so the new endpoints appear in the type system.

- [ ] **Step 1: Start backend if not running, then generate docs**

```bash
cd apps/backend && pnpm make:docs
```

This generates the OpenAPI spec from the route definitions and Tuyau metadata.

- [ ] **Step 2: Regenerate frontend types**

```bash
cd apps/frontend && pnpm types
```

This reads the OpenAPI spec and generates `types.d.ts`.

- [ ] **Step 3: Verify the new types exist**

Search the generated types for the new endpoints:

```bash
grep -n "rosters/search-dancers\|rosterId.*attach" apps/frontend/src/lib/api/types.d.ts | head -5
```

Expected: Matches for both endpoints.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/lib/api/types.d.ts apps/backend
git commit -m "chore: regenerate API types for attach-to-account endpoints"
```

**Note:** If `pnpm make:docs` requires the backend to be running (check if it errors), start it with `cd apps/backend && pnpm dev` in a separate terminal first.

---

## Task 6: Frontend — API Queries & Mutations

**Files:**
- Modify: `apps/frontend/src/features/org/api/roster-queries.ts`

- [ ] **Step 1: Add the attach mutation and search query**

Add these exports at the bottom of the file, after the existing `useResendInvites` function:

```typescript
export function useAttachAccount() {
  return $api.useMutation(
    "post",
    "/orgs/{slug}/events/{id}/rosters/{rosterId}/attach",
    {
      meta: {
        invalidateQueries: [
          ROSTER_LIST_KEY_PREFIX,
          ROSTER_FILTERS_KEY_PREFIX,
          ROSTER_STATS_KEY_PREFIX,
        ],
      },
    },
  );
}

export const rosterSearchQueries = {
  dancerUsers: (slug: string, eventId: string, q: string) =>
    $api.queryOptions(
      "get",
      "/orgs/{slug}/events/{id}/rosters/search-dancers",
      {
        params: {
          path: { slug, id: eventId },
          query: { q },
        },
      },
    ),
};
```

- [ ] **Step 2: Verify frontend compiles**

```bash
cd apps/frontend && pnpm build
```

Expected: Builds successfully. If the generated types don't include the new endpoints yet, this will fail — go back to Task 5.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/features/org/api/roster-queries.ts
git commit -m "feat(roster): add attach mutation and dancer search query"
```

---

## Task 7: Frontend — AttachAccountDialog Component

**Files:**
- Create: `apps/frontend/src/features/org/components/attach-account-dialog.tsx`

- [ ] **Step 1: Create the dialog component**

```tsx
// apps/frontend/src/features/org/components/attach-account-dialog.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import {
  rosterSearchQueries,
  useAttachAccount,
} from "@/features/org/api/roster-queries";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AttachAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgSlug: string;
  eventId: string;
  rosterId: string;
  isRelink: boolean;
  onSuccess: () => void;
}

export function AttachAccountDialog({
  open,
  onOpenChange,
  orgSlug,
  eventId,
  rosterId,
  isRelink,
  onSuccess,
}: AttachAccountDialogProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setDebouncedQuery("");
      setSelectedId(null);
    }
  }, [open]);

  const searchQuery = useQuery({
    ...rosterSearchQueries.dancerUsers(orgSlug, eventId, debouncedQuery),
    enabled: open && debouncedQuery.length >= 2,
  });

  const attachMutation = useAttachAccount();

  const results = searchQuery.data ?? [];
  const selectedUser = results.find((u) => u.id === selectedId) ?? null;

  const handleAttach = async () => {
    if (!selectedId) return;
    try {
      await attachMutation.mutateAsync({
        params: {
          path: { slug: orgSlug, id: eventId, rosterId },
        },
        body: { targetUserId: selectedId },
      });
      toastManager.add({
        title: isRelink ? "Account changed" : "Account attached",
        type: "success",
      });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      const message =
        (err as { message?: string })?.message ??
        "Failed to attach account. Please try again.";
      toastManager.add({ title: message, type: "error" });
    }
  };

  const title = isRelink ? "Change Account" : "Attach to Account";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Search for an existing user to link to this roster entry. The roster
            email and name will update to match the selected account.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                ref={inputRef}
                placeholder="Search by name or email..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedId(null);
                }}
                className="pl-9"
              />
            </div>

            {debouncedQuery.length >= 2 && searchQuery.isLoading && (
              <div className="flex justify-center py-4">
                <Spinner label="Searching..." />
              </div>
            )}

            {debouncedQuery.length >= 2 &&
              !searchQuery.isLoading &&
              results.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No users found
                </p>
              )}

            {results.length > 0 && (
              <div className="flex max-h-64 flex-col overflow-y-auto rounded-md border">
                {results.map((user) => {
                  const isSelected = user.id === selectedId;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      className={`flex items-center gap-3 border-l-3 px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? "border-l-primary bg-primary/5"
                          : "border-l-transparent hover:bg-muted"
                      }`}
                      onClick={() =>
                        setSelectedId(isSelected ? null : user.id)
                      }
                    >
                      <Avatar className="size-8">
                        <AvatarImage src={user.avatar ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {user.email}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="text-primary text-xs font-medium">
                          Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button
            onClick={handleAttach}
            disabled={!selectedId || attachMutation.isPending}
          >
            {attachMutation.isPending ? (
              <Spinner label="Attaching..." />
            ) : isRelink ? (
              "Change"
            ) : (
              "Attach"
            )}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/features/org/components/attach-account-dialog.tsx
git commit -m "feat(roster): add AttachAccountDialog component"
```

---

## Task 8: Frontend — Integrate into RosterDetailSheet

**Files:**
- Modify: `apps/frontend/src/features/org/components/roster-detail-sheet.tsx`

- [ ] **Step 1: Add imports**

Add these imports at the top of the file:

```typescript
import { AttachAccountDialog } from "./attach-account-dialog";
import { LinkIcon } from "lucide-react";
```

Add `LinkIcon` to the existing `lucide-react` import line if one exists, otherwise add a separate import.

- [ ] **Step 2: Add dialog state**

Inside `RosterDetailSheet`, add state for the dialog alongside the existing `deleteOpen` state:

```typescript
const [attachOpen, setAttachOpen] = useState(false);
```

- [ ] **Step 3: Add the attach button in the sheet body**

Inside the `<SheetContent>` section, add the attach button below the email field. Find the email `<Controller>` block (the one with `name="email"`) and add this immediately after its closing `/>`:

```tsx
                {isDancer && (
                  <button
                    type="button"
                    className="flex items-center gap-2.5 rounded-md border border-blue-500/20 bg-blue-500/5 px-3 py-2.5 text-left transition-colors hover:bg-blue-500/10"
                    onClick={() => setAttachOpen(true)}
                  >
                    <LinkIcon className="size-4 text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-blue-400">
                        {isActive ? "Change Account" : "Attach to Account"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {isActive
                          ? "Link to a different user account"
                          : "Link this roster entry to an existing user"}
                      </p>
                    </div>
                  </button>
                )}
```

- [ ] **Step 4: Add the dialog render**

Add the `AttachAccountDialog` render alongside the delete `<Dialog>`, inside the top-level fragment (`<>...</>`), after the delete confirmation dialog's closing `</Dialog>`:

```tsx
      {/* Attach to account */}
      {isDancer && (
        <AttachAccountDialog
          open={attachOpen}
          onOpenChange={setAttachOpen}
          orgSlug={orgSlug}
          eventId={eventId}
          rosterId={entry.id}
          isRelink={isActive}
          onSuccess={() => onOpenChange(false)}
        />
      )}
```

- [ ] **Step 5: Verify the frontend compiles**

```bash
cd apps/frontend && pnpm build
```

Expected: Builds successfully.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/features/org/components/roster-detail-sheet.tsx
git commit -m "feat(roster): integrate attach-to-account into roster detail sheet"
```

---

## Task 9: Manual Testing

- [ ] **Step 1: Start dev servers**

```bash
cd apps/backend && pnpm dev
# In another terminal:
cd apps/frontend && pnpm dev
```

- [ ] **Step 2: Test the happy path — Attach to Account**

1. Log in as an org admin
2. Navigate to the admin dancers page
3. Find a "Pending" (unregistered) dancer row
4. Click the row to open the roster detail sheet
5. Verify the "Attach to Account" button appears below the email field
6. Click it — verify the dialog opens
7. Type a name or email — verify search results appear after 300ms debounce
8. Click a user — verify it highlights with "Selected"
9. Click "Attach" — verify:
   - Success toast appears
   - Sheet closes
   - Table refreshes: dancer status flips to "Active", email updates

- [ ] **Step 3: Test the Change Account flow**

1. Open the same (now Active) dancer's sheet
2. Verify the button now reads "Change Account"
3. Click it, search for a different user, attach
4. Verify the roster email/name updates to the new user

- [ ] **Step 4: Test error states**

1. Try attaching a user who already has a roster entry on this event — verify error toast
2. Search with < 2 characters — verify no results (search doesn't fire)
3. Search for a name with no matches — verify "No users found" message

- [ ] **Step 5: Test edge cases**

1. Open dialog, search, select a user, then cancel — verify no changes
2. Open dialog for a coach roster entry — verify the button is NOT visible
3. Verify the "Resend invite" button still works alongside the new attach button

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix(roster): address attach-to-account testing feedback"
```

Only commit this step if testing revealed issues that needed fixes.
