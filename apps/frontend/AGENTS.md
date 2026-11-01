# Frontend

Guidance for `apps/frontend`. Monorepo structure, infrastructure, and cross-app flow are in the root `AGENTS.md`.

## Commands

```bash
pnpm dev          # Start development server (Vite)
pnpm build        # Type-check and build for production
pnpm lint         # Run ESLint
pnpm check        # Format with Prettier and fix ESLint issues
pnpm test         # Run Vitest in watch mode (`pnpm exec vitest run` for one pass)
pnpm types        # Regenerate API types from OpenAPI spec (requires backend running)
```

## Architecture

React 19 SPA using TanStack Router (file-based) and TanStack Query for data fetching.

### Key Patterns

**API Layer** (`src/lib/api/`):

- Uses `openapi-fetch` + `openapi-react-query` for type-safe API calls
- Types auto-generated from backend OpenAPI spec into `types.d.ts`
- Global client in `client.ts` exports `$api` for TanStack Query integration
- 401 responses auto-redirect to `/login`

**Authentication Flow**:

- Session fetched via `sessionQueries.session()` in `src/lib/session/queries.ts`
- `_app/route.tsx` guards authenticated routes with `beforeLoad`
- Unauthenticated users redirect to `/login`, incomplete onboarding to `/onboarding`
- `useSession()` (`src/lib/session/hooks/`) provides session in authenticated routes

**Access Control** (`src/lib/access/`):

- `createAccess(session)` returns policy helpers: `can()`, `is()`, `any()`, `all()`, `guard()`, `self()`
- Use `access.guard()` in route `beforeLoad` to enforce permissions
- Admins bypass all policy checks

**Feature Modules** (`src/features/`):

- A feature usually has `page.tsx`, `api/` (`queries.ts`, `mutations.ts`, `schemas.ts`), and `components/`
- Features cannot import from other features (enforced by eslint-plugin-boundaries)
- Import shared code from `components/`, `lib/`, `shared/`, `utils/`; generic hooks live in `components/hooks/`

### Routing

- Underscore prefix (`_app`, `_auth`) = layout routes
- Parentheses `(routes)` = pathless grouping
- Route tree auto-generated in `routeTree.gen.ts` - never edit manually
- Router context provides `queryClient` and `session` (in `_app`)

### Code Style

- Use `import { z } from 'zod'` (not default import)
- `@/*` alias maps to `./src/*`
- shadcn/ui components in `components/ui/` (new-york style, DiceUI registry available)

### Use Existing Components

- Build UI from `components/ui/` and `components/shared/`. Check them before you write markup.
- Don't recreate a component with Tailwind. For example, use `Card` or `Frame` instead of a bordered `div`, `Empty` for empty states, `Progress` or `Meter` for progress bars, `Select` instead of a native `<select>`, and `Table` for tables.
- Use Tailwind for layout and spacing between components.

### Dialogs and Cards

- Give every block of content padding on all sides, including the bottom. A wrapper with only `px-6` puts the content flush against the footer or the next section.
- In a `Dialog`, put body content in `DialogPanel`. It sets the padding between the header and the footer.
- `AlertDialog` has no body slot. Wrap content between `AlertDialogHeader` and `AlertDialogFooter` in `px-6 pb-4`, as `features/settings/components/danger-settings.tsx` does.
- Before you report a new or changed dialog as done, look at a screenshot of it. Check the space between the last content block and the footer.
