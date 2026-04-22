# School Skill Weighting

Schools can set a priority weight (1-5) on each skill they select, influencing the recommendation algorithm's dancer matching. Dancers keep the existing pill-based selector unchanged.

## Frontend

### Component architecture

The existing `SkillsDialog` shell (title, description, save/cancel) stays shared. The inner content swaps based on `session.type`:

- **Dancer** → `SkillsPillSelector` (existing pill components, untouched)
- **School** → `SkillsWeightedList` (new component)

### SkillsWeightedList

Displays all skills in a scrollable vertical list, grouped by category with section headers.

Each row: skill name on the left, five dots on the right. Dots represent priority weight 1-5:

- All dots empty = skill not selected
- Clicking dot N on an unselected skill = select at weight N
- Clicking a different dot = change weight
- Clicking the currently-active dot = deselect the skill entirely

A "Priority" label sits above/beside the dots column with a tooltip: "Higher priority = stronger match in dancer recommendations."

### Mobile considerations

- Skill name and dots share a single row; dots right-aligned
- Dot tap targets minimum 44px
- Category headers clearly visible while scrolling
- Impeccable skill used for production-grade visual polish and responsive behavior

### State

```
Dancer:  selectedSkillIds: string[]
School:  selectedSkills: Map<string, number>   // skillId → weight (1-5)
```

`SkillsDialog.onSave` accepts `string[] | { skillId: string; weight: number }[]`. The school mutation sends the object array; the dancer mutation sends the string array.

## API

### School update skills

`PATCH /schools/me/skills`

Current payload:
```json
{ "skills": ["pointe-work", "floor-work"] }
```

New payload:
```json
{ "skills": [
    { "skillId": "pointe-work", "weight": 3 },
    { "skillId": "floor-work", "weight": 5 }
  ]
}
```

**Validator** (`apps/backend/app/modules/schools/update-skills/validator.ts`): Accept array of `{ skillId: string, weight: number }`. Weight validated as integer 1-5.

**Service** (`apps/backend/app/modules/schools/update-skills/service.ts`): Insert `weight` alongside `skillId` into `schoolSkills` table.

### School get skills

`GET /schools/me/skills`

Current response: `[{ "skillId": "pointe-work" }]`

New response: `[{ "skillId": "pointe-work", "weight": 1 }]`

**Service** (`apps/backend/app/modules/schools/get-skills/service.ts`): Return `weight` column alongside `skillId`.

### Admin update school skills

`PATCH /admin/schools/:username/skills`

Same payload change as the school endpoint for consistency.

**Validator** (`apps/backend/app/modules/admin/update-school-skills/validator.ts`): Same schema as school validator.

**Service** (`apps/backend/app/modules/admin/update-school-skills/service.ts`): Delegates to the updated school service which now handles weights.

### Dancer endpoints

No changes. Payload stays `{ skills: string[] }`.

## Files to modify

### Backend
- `apps/backend/app/modules/schools/update-skills/validator.ts` — new payload schema
- `apps/backend/app/modules/schools/update-skills/service.ts` — insert weight
- `apps/backend/app/modules/schools/get-skills/service.ts` — return weight
- `apps/backend/app/modules/admin/update-school-skills/validator.ts` — new payload schema
- `apps/backend/app/modules/admin/update-school-skills/service.ts` — pass weight through

### Frontend
- `apps/frontend/src/shared/skills/components/skills-dialog.tsx` — swap inner content by session type, update onSave type
- `apps/frontend/src/shared/skills/components/skills-weighted-list.tsx` — new component
- `apps/frontend/src/shared/skills/components/skill-weight-dots.tsx` — new dot input component
- `apps/frontend/src/features/school/api/mutations.ts` — send weighted payload
- `apps/frontend/src/features/school/api/queries.ts` — expect weight in response (if not already typed from OpenAPI)
