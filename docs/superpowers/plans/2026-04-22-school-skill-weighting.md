# School Skill Weighting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let schools set a 1-5 priority weight on each skill via a dot-based UI, feeding the existing recommendation algorithm.

**Architecture:** The backend school skills endpoints change from `string[]` to `{ skillId, weight }[]`. The frontend `SkillsDialog` swaps its inner content by session type — dancers keep the pill selector, schools get a new vertical weighted list. The Impeccable skill is used for a final mobile-friendly polish pass.

**Tech Stack:** AdonisJS + VineJS (backend validation), Drizzle ORM (DB), React 19 + TanStack Query (frontend), BaseUI components, Tailwind CSS.

---

### Task 1: Backend — Update school skills validator

**Files:**
- Modify: `apps/backend/app/modules/schools/update-skills/validator.ts`

- [ ] **Step 1: Update the VineJS schema to accept weighted skill objects**

Replace the entire file content:

```typescript
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    skills: vine
      .array(
        vine.object({
          skillId: vine.string(),
          weight: vine.number().min(1).max(5).parse((v) => Math.round(v)),
        })
      )
      .minLength(1),
  })
);

export type Validator = Infer<typeof schema>;
```

- [ ] **Step 2: Verify types compile**

Run: `cd apps/backend && pnpm typecheck`
Expected: No errors related to the validator file.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/app/modules/schools/update-skills/validator.ts
git commit -m "feat: update school skills validator to accept weighted objects"
```

---

### Task 2: Backend — Update school skills service to insert weights

**Files:**
- Modify: `apps/backend/app/modules/schools/update-skills/service.ts`

- [ ] **Step 1: Update the service to use the new payload shape and insert weight**

Replace the entire file content:

```typescript
import { schoolSkills } from "#database/schema/skills";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { type Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string, data: Validator) {
    await this.db.tx(async (tx) => {
      await tx.delete(schoolSkills).where(eq(schoolSkills.schoolId, profileId));

      if (data.skills.length > 0) {
        await tx.insert(schoolSkills).values(
          data.skills.map((skill) => ({
            schoolId: profileId,
            skillId: skill.skillId,
            weight: skill.weight,
          }))
        );
      }
    });
  }
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd apps/backend && pnpm typecheck`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/app/modules/schools/update-skills/service.ts
git commit -m "feat: insert skill weight when saving school skills"
```

---

### Task 3: Backend — Return weight from school get-skills endpoint

**Files:**
- Modify: `apps/backend/app/modules/schools/get-skills/service.ts`

- [ ] **Step 1: Add weight to the returned columns**

Replace the entire file content:

```typescript
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string) {
    return await this.db.use((db) =>
      db.query.schoolSkills.findMany({
        where: { schoolId: profileId },
        columns: { skillId: true, weight: true },
      })
    );
  }
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd apps/backend && pnpm typecheck`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/app/modules/schools/get-skills/service.ts
git commit -m "feat: return skill weight from school get-skills endpoint"
```

---

### Task 4: Backend — Update admin school skills validator

**Files:**
- Modify: `apps/backend/app/modules/admin/update-school-skills/validator.ts`

- [ ] **Step 1: Update the admin validator to match the school validator shape**

Replace the entire file content:

```typescript
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(
  vine.object({
    params: vine.object({
      username: vine.string(),
    }),
    skills: vine
      .array(
        vine.object({
          skillId: vine.string(),
          weight: vine.number().min(1).max(5).parse((v) => Math.round(v)),
        })
      )
      .minLength(1),
  })
);

export type Validator = Infer<typeof schema>;
```

- [ ] **Step 2: Verify types compile**

Run: `cd apps/backend && pnpm typecheck`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/app/modules/admin/update-school-skills/validator.ts
git commit -m "feat: update admin school skills validator for weighted objects"
```

---

### Task 5: Backend — Regenerate OpenAPI types

**Files:**
- Modify: `apps/frontend/src/lib/api/types.d.ts` (auto-generated)

- [ ] **Step 1: Start the backend dev server**

Run: `cd apps/backend && pnpm dev` (in background)

- [ ] **Step 2: Regenerate frontend API types**

Run: `cd apps/frontend && pnpm types`
Expected: `types.d.ts` regenerated with the new `weight` field in school skills request/response schemas.

- [ ] **Step 3: Verify the generated types include weight**

Check that `types.d.ts` now has:
- The school update-skills request body containing `{ skillId: string; weight: number }[]`
- The school get-skills response containing `weight` field

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/lib/api/types.d.ts
git commit -m "chore: regenerate API types with school skill weights"
```

---

### Task 6: Frontend — Create SkillWeightDots component

**Files:**
- Create: `apps/frontend/src/shared/skills/components/skill-weight-dots.tsx`

- [ ] **Step 1: Create the dot input component**

```tsx
import { cn } from "@/components/utils/cn";

interface SkillWeightDotsProps {
  weight: number | null;
  onChange: (weight: number | null) => void;
}

export function SkillWeightDots({ weight, onChange }: SkillWeightDotsProps) {
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Skill priority">
      {[1, 2, 3, 4, 5].map((dot) => (
        <button
          key={dot}
          type="button"
          onClick={() => onChange(weight === dot ? null : dot)}
          aria-label={`Priority ${dot}`}
          aria-pressed={weight !== null && dot <= weight}
          className={cn(
            "size-5 min-h-[44px] min-w-[44px] flex items-center justify-center",
            "rounded-full transition-colors",
          )}
        >
          <span
            className={cn(
              "block size-3 rounded-full border-2 transition-colors",
              weight !== null && dot <= weight
                ? "border-brand bg-brand"
                : "border-muted-foreground/40 bg-transparent",
            )}
          />
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd apps/frontend && pnpm build`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/shared/skills/components/skill-weight-dots.tsx
git commit -m "feat: create SkillWeightDots component"
```

---

### Task 7: Frontend — Create SkillsWeightedList component

**Files:**
- Create: `apps/frontend/src/shared/skills/components/skills-weighted-list.tsx`

- [ ] **Step 1: Create the weighted list component**

This component shows all skills grouped by category in a vertical scrollable list. Each skill row has the name on the left and weight dots on the right.

```tsx
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { useSkillsByCategory } from "../hooks/use-skills-by-category";
import { SkillWeightDots } from "./skill-weight-dots";

interface SkillsWeightedListProps {
  selectedSkills: Map<string, number>;
  onWeightChange: (skillId: string, weight: number | null) => void;
}

export function SkillsWeightedList({
  selectedSkills,
  onWeightChange,
}: SkillsWeightedListProps) {
  const skillsByCategory = useSkillsByCategory();
  const categories = Object.keys(skillsByCategory);

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="text-muted-foreground flex items-center gap-1.5 px-4 text-xs font-medium">
        <span>Priority</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>
              Higher priority = stronger match in dancer recommendations
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <ScrollArea scrollFade className="h-full">
        <div className="flex flex-col gap-4 px-4 pb-4">
          {categories.map((category) => (
            <div key={category} className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                {category}
              </span>
              <div className="flex flex-col">
                {skillsByCategory[category].map((skill) => (
                  <div
                    key={skill.slug}
                    className="flex items-center justify-between gap-4 py-1.5"
                  >
                    <span className="text-sm">{skill.name}</span>
                    <SkillWeightDots
                      weight={selectedSkills.get(skill.slug) ?? null}
                      onChange={(weight) => onWeightChange(skill.slug, weight)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd apps/frontend && pnpm build`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/shared/skills/components/skills-weighted-list.tsx
git commit -m "feat: create SkillsWeightedList component"
```

---

### Task 8: Frontend — Update SkillsDialog to swap content by session type

**Files:**
- Modify: `apps/frontend/src/shared/skills/components/skills-dialog.tsx`

- [ ] **Step 1: Rewrite the dialog to support both dancer (pills) and school (weighted list) modes**

Replace the entire file content:

```tsx
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/session";
import type { ButtonProps } from "@base-ui/react";
import { Suspense, useCallback, useState } from "react";
import { SkillsList } from "./skills-list";
import { SkillsSummary } from "./skills-summary";
import { SkillsWeightedList } from "./skills-weighted-list";

type WeightedSkill = { skillId: string; weight: number };

interface SkillsDialogProps {
  selectedSkillIds: string[];
  selectedWeights?: Map<string, number>;
  onSave: (skillIds: string[], weights?: Map<string, number>) => Promise<void>;
  isPending?: boolean;
}

function SkillsDialogContentFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner label="Loading skills..." />
    </div>
  );
}

interface DancerContentProps {
  selectedSkillIds: string[];
  onToggle: (skillId: string) => void;
}

function DancerContent({ selectedSkillIds, onToggle }: DancerContentProps) {
  return (
    <>
      <DialogPanel className="h-full">
        <SkillsList selectedSkillIds={selectedSkillIds} onToggle={onToggle} />
      </DialogPanel>

      <SkillsSummary
        className="mx-6 mb-2 md:hidden"
        selectedSkillIds={selectedSkillIds}
        onRemove={onToggle}
      />
    </>
  );
}

interface SchoolContentProps {
  selectedSkills: Map<string, number>;
  onWeightChange: (skillId: string, weight: number | null) => void;
}

function SchoolContent({ selectedSkills, onWeightChange }: SchoolContentProps) {
  return (
    <DialogPanel className="h-full">
      <SkillsWeightedList
        selectedSkills={selectedSkills}
        onWeightChange={onWeightChange}
      />
    </DialogPanel>
  );
}

export function SkillsDialog({
  selectedSkillIds,
  selectedWeights,
  onSave,
  isPending,
  ...props
}: SkillsDialogProps & ButtonProps) {
  const session = useSession();
  const isSchool = session.type === "school";

  const [open, setOpen] = useState(false);
  const [localSelectedSkillIds, setLocalSelectedSkillIds] =
    useState<string[]>(selectedSkillIds);
  const [localWeights, setLocalWeights] = useState<Map<string, number>>(
    () => selectedWeights ?? new Map()
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setLocalSelectedSkillIds(selectedSkillIds);
      setLocalWeights(selectedWeights ?? new Map());
    }
    setOpen(nextOpen);
  };

  const handleToggle = (skillId: string) => {
    setLocalSelectedSkillIds((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleWeightChange = useCallback(
    (skillId: string, weight: number | null) => {
      setLocalWeights((prev) => {
        const next = new Map(prev);
        if (weight === null) {
          next.delete(skillId);
          setLocalSelectedSkillIds((ids) =>
            ids.filter((id) => id !== skillId)
          );
        } else {
          next.set(skillId, weight);
          setLocalSelectedSkillIds((ids) =>
            ids.includes(skillId) ? ids : [...ids, skillId]
          );
        }
        return next;
      });
    },
    []
  );

  const handleSave = async () => {
    if (isSchool) {
      await onSave(localSelectedSkillIds, localWeights);
    } else {
      await onSave(localSelectedSkillIds);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        {...props}
        render={props.render ?? <Button variant="outline" />}
      >
        {props.children}
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-sm:h-[calc(100svh-3rem)] sm:h-200 sm:max-h-[90svh]">
        <DialogHeader>
          <DialogTitle>Dance Skills</DialogTitle>
          <DialogDescription>
            Skills help us connect you with the right{" "}
            {isSchool ? "dancers" : "programs"}
          </DialogDescription>
        </DialogHeader>

        <Suspense fallback={<SkillsDialogContentFallback />}>
          {isSchool ? (
            <SchoolContent
              selectedSkills={localWeights}
              onWeightChange={handleWeightChange}
            />
          ) : (
            <DancerContent
              selectedSkillIds={localSelectedSkillIds}
              onToggle={handleToggle}
            />
          )}
        </Suspense>

        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Spinner label="Saving..." /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd apps/frontend && pnpm build`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/shared/skills/components/skills-dialog.tsx
git commit -m "feat: swap skills dialog content by session type (pills vs weighted list)"
```

---

### Task 9: Frontend — Update school SkillsList to send weighted payload

**Files:**
- Modify: `apps/frontend/src/features/school/components/profile/sections/skills-list.tsx`

- [ ] **Step 1: Update the school skills-list to pass weights and send weighted payload**

Replace the entire file content:

```tsx
import { toastManager } from "@/components/ui/toast-manager";
import { useUpdateSkills } from "@/features/school/api/mutations";
import { schoolQueries } from "@/features/school/api/queries";
import { handleApiError } from "@/lib/api/errors";
import { SkillsDialog } from "@/shared/skills/components/skills-dialog";
import type { ButtonProps } from "@base-ui/react";
import { useQuery } from "@tanstack/react-query";

interface SkillsListProps extends ButtonProps {
  username?: string;
}

export function SkillsList({ username, ...props }: SkillsListProps) {
  const { data } = useQuery(schoolQueries.skills());
  const { mutateAsync, isPending } = useUpdateSkills(username);

  const selectedSkillIds = (data ?? []).map((skill) => skill.skillId);
  const selectedWeights = new Map(
    (data ?? []).map((skill) => [skill.skillId, skill.weight ?? 1])
  );

  const handleSave = async (
    _skillIds: string[],
    weights?: Map<string, number>
  ) => {
    const skills = [...(weights ?? new Map())].map(([skillId, weight]) => ({
      skillId,
      weight,
    }));

    await mutateAsync(
      { body: { skills } },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Your skills have been updated",
            type: "success",
          });
        },
        onError: handleApiError({
          onError: (error) => {
            toastManager.add({
              title: "Error",
              description: error.message,
              type: "error",
            });
          },
          onValidation: (_, message) => {
            toastManager.add({
              title: "Error",
              description: message,
              type: "error",
            });
          },
        }),
      }
    );
  };

  return (
    <SkillsDialog
      selectedSkillIds={selectedSkillIds}
      selectedWeights={selectedWeights}
      onSave={handleSave}
      isPending={isPending}
      {...props}
    />
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd apps/frontend && pnpm build`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/features/school/components/profile/sections/skills-list.tsx
git commit -m "feat: send weighted skill payload from school profile"
```

---

### Task 10: Frontend — Update admin skills tab for weighted payload

**Files:**
- Modify: `apps/frontend/src/features/admin/schools/components/tabs/skills-tab.tsx`

- [ ] **Step 1: Update the admin skills tab to support weights**

Replace the entire file content:

```tsx
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { useAdminUpdateSchoolSkills } from "@/features/admin/api/mutations";
import { SkillsList } from "@/shared/skills/components/skills-list";
import { SkillsWeightedList } from "@/shared/skills/components/skills-weighted-list";
import {
  forwardRef,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import type { TabHandle } from "./types";

interface SkillsTabProps {
  username: string;
  selectedSkillIds: string[];
  selectedWeights?: Map<string, number>;
  onStateChange: (state: { isDirty: boolean; isPending: boolean }) => void;
}

function SkillsTabFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner label="Loading skills..." />
    </div>
  );
}

export const SkillsTab = forwardRef<TabHandle, SkillsTabProps>(
  function SkillsTab(
    { username, selectedSkillIds, selectedWeights, onStateChange },
    ref
  ) {
    const [localWeights, setLocalWeights] = useState<Map<string, number>>(
      () => selectedWeights ?? new Map()
    );
    const { mutate, isPending } = useAdminUpdateSchoolSkills();

    const handleWeightChange = useCallback(
      (skillId: string, weight: number | null) => {
        setLocalWeights((prev) => {
          const next = new Map(prev);
          if (weight === null) {
            next.delete(skillId);
          } else {
            next.set(skillId, weight);
          }
          return next;
        });
      },
      []
    );

    const handleSave = () => {
      const skills = [...localWeights].map(([skillId, weight]) => ({
        skillId,
        weight,
      }));

      if (skills.length === 0) return;

      mutate(
        {
          params: { path: { username } },
          body: { skills },
        },
        {
          onSuccess: () => {
            toastManager.add({
              title: "Success",
              description: "Skills updated successfully",
              type: "success",
            });
          },
          onError: () => {
            toastManager.add({
              title: "Error",
              description: "Failed to update skills",
              type: "error",
            });
          },
        }
      );
    };

    const hasChanges =
      JSON.stringify([...localWeights].sort()) !==
      JSON.stringify([...(selectedWeights ?? new Map())].sort());

    useImperativeHandle(ref, () => ({
      save: handleSave,
      isDirty: hasChanges,
      isPending,
    }));

    useEffect(() => {
      onStateChange({ isDirty: hasChanges, isPending });
    }, [hasChanges, isPending, onStateChange]);

    return (
      <div className="h-full overflow-auto">
        <Suspense fallback={<SkillsTabFallback />}>
          <SkillsWeightedList
            selectedSkills={localWeights}
            onWeightChange={handleWeightChange}
          />
        </Suspense>
      </div>
    );
  }
);
```

**Note:** The parent `edit-school-dialog.tsx` will also need to pass `selectedWeights` from the admin school data. Check how the parent fetches school skills — if it already includes `weight` from the API response, wire it through. If not, the admin get-school endpoint may need to include weights too. Verify and adjust accordingly.

- [ ] **Step 2: Verify types compile**

Run: `cd apps/frontend && pnpm build`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/features/admin/schools/components/tabs/skills-tab.tsx
git commit -m "feat: update admin skills tab for weighted skill payload"
```

---

### Task 11: Frontend — Verify Tooltip import path

**Files:**
- Check: `apps/frontend/src/components/ui/tooltip.tsx`

- [ ] **Step 1: Verify the Tooltip component exports match the imports in SkillsWeightedList**

The `SkillsWeightedList` imports `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger` from `@/components/ui/tooltip`. Verify these are exported. The project uses BaseUI, not Radix — if the tooltip component has different export names, update the import in `skills-weighted-list.tsx` to match.

If BaseUI's tooltip uses a different API (e.g., `Tooltip.Provider`, `Tooltip.Trigger`, `Tooltip.Popup`), rewrite the tooltip usage in `skills-weighted-list.tsx` to match the project's actual pattern.

- [ ] **Step 2: Fix imports if needed and verify build**

Run: `cd apps/frontend && pnpm build`
Expected: No errors.

- [ ] **Step 3: Commit (if changes were needed)**

```bash
git add apps/frontend/src/shared/skills/components/skills-weighted-list.tsx
git commit -m "fix: correct tooltip imports for weighted list"
```

---

### Task 12: End-to-end manual test

- [ ] **Step 1: Start both backend and frontend dev servers**

Run (in separate terminals):
```bash
cd apps/backend && pnpm dev
cd apps/frontend && pnpm dev
```

- [ ] **Step 2: Test school flow**

1. Log in as a school user
2. Navigate to profile / skills section
3. Open the skills dialog — should see vertical list grouped by category with dots
4. Click dot 3 on a skill — dots 1-3 should fill, skill is selected at weight 3
5. Click dot 3 again — skill should deselect (all dots empty)
6. Click dot 1 on one skill, dot 5 on another — confirm different weights
7. Click Save — should succeed, toast appears
8. Reopen dialog — weights should persist as saved

- [ ] **Step 3: Test dancer flow (regression)**

1. Log in as a dancer user
2. Open skills dialog — should see existing pill-based selector
3. Toggle some skills, save — should work identically to before

- [ ] **Step 4: Test admin flow**

1. Log in as admin
2. Open a school's edit dialog, go to skills tab
3. Should see weighted list, set some weights, save

---

### Task 13: Impeccable polish pass — mobile-friendly design

- [ ] **Step 1: Invoke the `impeccable` skill**

Run the Impeccable skill targeting the new school skills UI components:
- `apps/frontend/src/shared/skills/components/skill-weight-dots.tsx`
- `apps/frontend/src/shared/skills/components/skills-weighted-list.tsx`
- `apps/frontend/src/shared/skills/components/skills-dialog.tsx`

Focus areas:
- Touch-friendly dot targets (44px minimum) on mobile
- Vertical list responsive behavior on small screens
- Category header styling and scroll behavior
- Visual polish: dot fill animations, hover states, active states
- Ensure the dialog's `max-sm:h-[calc(100svh-3rem)]` works well with the vertical layout

- [ ] **Step 2: Test on mobile viewport**

Use browser dev tools to test at 375px and 390px widths. Verify:
- Skill name doesn't truncate unnecessarily
- Dots are tappable without mis-taps
- Scroll behavior is smooth
- No horizontal overflow

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/shared/skills/components/
git commit -m "style: mobile-friendly polish for school skill weighting UI"
```
