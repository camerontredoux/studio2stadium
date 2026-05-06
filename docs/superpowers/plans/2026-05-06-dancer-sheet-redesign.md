# Dancer Sheet Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the dancer scouting sheet to prioritize note-taking with a cleaner header, condensed rating/favorite row, bio empty state, manual save via footer button, and "Visit Profile" link for registered dancers.

**Architecture:** The sheet moves from self-managing child components (NotesEditor auto-saves, RatingInput mutates on click) to a parent-owned dirty-state model where `DancerSheetContent` holds local state and a single Save button persists both notes and rating. The backend adds `username` to the dancer detail response by joining the `users` table.

**Tech Stack:** React 19, TanStack Query, openapi-fetch, Drizzle ORM, AdonisJS 6, BaseUI

---

### Task 1: Add `username` to backend dancer detail response

**Files:**
- Modify: `apps/backend/app/modules/orgs/scouting/dancers/get-by-id/service.ts`
- Modify: `apps/backend/app/database/schema/users.ts` (read-only reference)

- [ ] **Step 1: Add users import and join to the query**

In `apps/backend/app/modules/orgs/scouting/dancers/get-by-id/service.ts`, add the `users` import and the `username` select field + join:

```typescript
// Add to imports at top:
import { users } from "#database/schema/users";
```

Add `username` to the select object (after the `isRegistered` field on line 29):

```typescript
username: users.username,
```

Add a left join to the `users` table (after the `dancerProfiles` join, around line 55):

```typescript
.leftJoin(users, eq(users.id, eventRosters.userId))
```

- [ ] **Step 2: Verify the backend compiles**

Run: `cd apps/backend && pnpm typecheck`
Expected: No errors

- [ ] **Step 3: Regenerate OpenAPI spec and frontend types**

Run: `cd apps/backend && pnpm make:docs`
Then: `cd apps/frontend && pnpm types`

Verify `username` appears in the `OrgsIdDancersIdResponse` type in `apps/frontend/src/lib/api/types.d.ts`.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/app/modules/orgs/scouting/dancers/get-by-id/service.ts
git commit -m "feat(backend): add username to dancer detail response"
```

---

### Task 2: Refactor `RatingInput` to controlled component

**Files:**
- Modify: `apps/frontend/src/features/org/components/rating-input.tsx`

- [ ] **Step 1: Rewrite RatingInput as a controlled input**

Replace the entire contents of `rating-input.tsx` with:

```tsx
import { Rating, RatingItem } from "@/components/ui/rating";

export function RatingInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number) => void;
}) {
  const onSet = (n: number) => {
    navigator.vibrate?.(10);
    onChange(n);
  };

  return (
    <div className="flex items-center gap-1">
      <Rating value={value ?? 0} onValueChange={onSet}>
        {Array.from({ length: 5 }, (_, i) => (
          <RatingItem key={i} index={i} />
        ))}
      </Rating>
      {value != null && (
        <span className="text-muted-foreground ml-2 text-sm">{value}/5</span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `cd apps/frontend && pnpm build`
Expected: Build will fail because `dancer-sheet.tsx` still passes old props — that's fine, confirms the interface changed.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/features/org/components/rating-input.tsx
git commit -m "refactor: make RatingInput a controlled component"
```

---

### Task 3: Refactor `NotesEditor` to controlled textarea

**Files:**
- Modify: `apps/frontend/src/features/org/components/notes-editor.tsx`

- [ ] **Step 1: Rewrite NotesEditor as a controlled textarea**

Replace the entire contents of `notes-editor.tsx` with:

```tsx
import { Textarea } from "@/components/ui/textarea";

export function NotesEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Your private notes on this dancer…"
      className="min-h-32 flex-1"
      maxLength={5000}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/features/org/components/notes-editor.tsx
git commit -m "refactor: make NotesEditor a controlled component"
```

---

### Task 4: Redesign `DancerSheet` and `DancerSheetContent`

**Files:**
- Modify: `apps/frontend/src/features/org/components/dancer-sheet.tsx`

This is the main task. The sheet gets a new layout, owns dirty state, and has a save footer.

- [ ] **Step 1: Rewrite dancer-sheet.tsx**

Replace the entire contents of `dancer-sheet.tsx` with:

```tsx
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import { $api } from "@/lib/api/client";
import { Loader2Icon } from "lucide-react";
import { FavoriteButton } from "./favorite-button";
import { RatingInput } from "./rating-input";
import { NotesEditor } from "./notes-editor";
import { toastManager } from "@/components/ui/toast-manager";
import { Link } from "@tanstack/react-router";

interface DancerSheetProps {
  rosterId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DancerSheet({
  rosterId,
  open,
  onOpenChange,
}: DancerSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup side="right" variant="inset">
        {rosterId && open && <DancerSheetContent rosterId={rosterId} />}
      </SheetPopup>
    </Sheet>
  );
}

function DancerSheetContent({ rosterId }: { rosterId: string }) {
  const { org } = useOrg();
  const qc = useQueryClient();
  const { data: dancer, isLoading } = useQuery(
    scoutingQueries.dancer(org.slug, rosterId),
  );

  const [notes, setNotes] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const currentNotes = notes ?? dancer?.note ?? "";
  const currentRating = rating !== undefined ? rating : (dancer?.rating ?? null);
  const isDirty =
    dancer != null &&
    (currentNotes !== (dancer.note ?? "") || currentRating !== (dancer.rating ?? null));

  const upsertNotes = $api.useMutation(
    "put",
    "/orgs/{slug}/dancers/{dancerRosterId}/notes",
  );
  const deleteNotes = $api.useMutation(
    "delete",
    "/orgs/{slug}/dancers/{dancerRosterId}/notes",
  );
  const upsertRating = $api.useMutation(
    "put",
    "/orgs/{slug}/dancers/{dancerRosterId}/rating",
  );

  async function handleSave() {
    if (!isDirty || isSaving) return;
    setIsSaving(true);

    const pathParams = { slug: org.slug, dancerRosterId: rosterId };
    const trimmedNotes = currentNotes.trim();

    const [notesResult, ratingResult] = await Promise.allSettled([
      trimmedNotes === ""
        ? deleteNotes.mutateAsync({ params: { path: pathParams } })
        : upsertNotes.mutateAsync({
            params: { path: pathParams },
            body: { content: currentNotes },
          }),
      upsertRating.mutateAsync({
        params: { path: pathParams },
        body: { rating: currentRating ?? 0 },
      }),
    ]);

    const notesFailed = notesResult.status === "rejected";
    const ratingFailed = ratingResult.status === "rejected";

    if (notesFailed || ratingFailed) {
      const failed = [notesFailed && "notes", ratingFailed && "rating"]
        .filter(Boolean)
        .join(" and ");
      toastManager.add({
        title: "Save failed",
        description: `Could not save ${failed}. Please try again.`,
        type: "error",
      });
    }

    if (!notesFailed) setNotes(null);
    if (!ratingFailed) setRating(undefined);

    qc.invalidateQueries({
      queryKey: scoutingQueries.dancers(org.slug).queryKey,
    });
    qc.invalidateQueries({
      queryKey: scoutingQueries.dancer(org.slug, rosterId).queryKey,
    });
    qc.invalidateQueries({
      queryKey: scoutingQueries.rankings(org.slug).queryKey,
    });

    setIsSaving(false);
  }

  if (isLoading || !dancer) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SheetHeader>
        <div className="flex items-start gap-3">
          <Avatar className="size-14 rounded-lg">
            <AvatarImage src={dancer.profilePhotoUrl ?? undefined} />
            <AvatarFallback className="rounded-lg text-lg">
              {dancer.firstName?.[0]}
              {dancer.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-0.5">
            <SheetTitle>
              {dancer.bibNumber != null && (
                <span className="text-muted-foreground mr-1.5 font-mono text-sm">
                  #{String(dancer.bibNumber).padStart(2, "0")}
                </span>
              )}
              {dancer.firstName} {dancer.lastName}
            </SheetTitle>
            <p className="text-muted-foreground text-sm">
              {[
                dancer.gradYear ? `Class of ${dancer.gradYear}` : null,
                dancer.studio,
                dancer.state,
                dancer.gpa != null ? `GPA ${dancer.gpa.toFixed(1)}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {dancer.isRegistered && dancer.username ? (
              <Link
                to="/$username"
                params={{ username: dancer.username }}
                className="text-indigo-400 hover:text-indigo-300 text-sm"
              >
                Visit Profile →
              </Link>
            ) : (
              <Badge variant="error">Unregistered</Badge>
            )}
          </div>
        </div>
      </SheetHeader>

      <SheetContent className="flex flex-col gap-4 px-4 py-3">
        <div className="flex items-center">
          <div className="flex-1">
            <RatingInput
              value={currentRating}
              onChange={(v) => setRating(v)}
            />
          </div>
          <FavoriteButton
            dancerRosterId={rosterId}
            isFavorited={dancer.isFavorited}
          />
        </div>

        <div>
          <label className="text-muted-foreground mb-1 block text-xs uppercase tracking-wide">
            Bio
          </label>
          {dancer.bio ? (
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {dancer.bio}
            </p>
          ) : (
            <p className="text-muted-foreground/50 text-sm italic">
              No bio provided
            </p>
          )}
        </div>

        <div className="flex flex-1 flex-col">
          <label className="text-muted-foreground mb-1 block text-xs uppercase tracking-wide">
            Notes
          </label>
          <NotesEditor
            value={currentNotes}
            onChange={(v) => setNotes(v)}
          />
        </div>
      </SheetContent>

      <SheetFooter>
        <Button onClick={handleSave} disabled={!isDirty || isSaving}>
          {isSaving && <Loader2Icon className="size-4 animate-spin" />}
          Save
        </Button>
      </SheetFooter>
    </>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd apps/frontend && pnpm build`
Expected: PASS — all type errors resolved.

Note: If the build fails because `username` is not yet on the type (backend types not regenerated), the `dancer.username` reference will error. Ensure Task 1 step 3 (type regeneration) is complete first.

- [ ] **Step 3: Update any callers that pass `compareIds` / `onToggleCompare` to `DancerSheet`**

Search for usages:

```bash
grep -rn "DancerSheet\|dancer-sheet" apps/frontend/src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules"
```

For each caller, remove the `compareIds` and `onToggleCompare` props since `DancerSheetProps` no longer accepts them.

- [ ] **Step 4: Verify the full build**

Run: `cd apps/frontend && pnpm build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/features/org/components/dancer-sheet.tsx
git add -u  # pick up any caller changes
git commit -m "feat: redesign dancer sheet with manual save, cleaner layout, visit profile link"
```

---

### Task 5: Manual verification

**Files:** None (testing only)

- [ ] **Step 1: Start the dev server**

Run: `cd apps/frontend && pnpm dev`

- [ ] **Step 2: Test the happy path**

1. Open the scouting page, click a dancer to open the sheet
2. Verify header shows: avatar, name with bib, metadata line, and either "Visit Profile →" (registered) or red "Unregistered" badge
3. Verify rating stars and heart button are on the same row
4. Verify bio section shows content or "No bio provided" in muted italic
5. Verify notes textarea fills the remaining space
6. Verify Save button is disabled (nothing changed)
7. Change the rating — Save button should become enabled
8. Type in notes — Save button stays enabled
9. Click Save — button shows spinner, then disables after success
10. Reload the page, reopen the sheet — verify notes and rating persisted

- [ ] **Step 3: Test edge cases**

1. Open sheet, change rating, then change it back to original — Save should be disabled (not dirty)
2. Open sheet, type notes, clear them completely — Save should be enabled (dirty vs original), and saving should DELETE the note
3. If a registered dancer exists, click "Visit Profile →" — should navigate to `/$username`
4. Test an unregistered dancer — should show red "Unregistered" badge instead of link

- [ ] **Step 4: Commit any fixes**

If any issues were found and fixed, commit them:

```bash
git add -u
git commit -m "fix: dancer sheet polish from manual testing"
```
