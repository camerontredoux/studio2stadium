# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start development server (Vite)
pnpm build        # Type-check and build for production
pnpm lint         # Run ESLint
pnpm check        # Format with Prettier and fix ESLint issues
pnpm test         # Run Vitest tests
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
- Session fetched via `queries.session()` in `src/features/login/api/queries.ts`
- `_app/route.tsx` guards authenticated routes with `beforeLoad`
- Unauthenticated users redirect to `/login`, incomplete onboarding to `/onboarding`
- `useSession()` hook provides session in authenticated routes

**Access Control** (`src/lib/access.ts`):
- `createAccess(session)` returns policy helpers: `can()`, `is()`, `any()`, `all()`, `guard()`, `self()`
- Use `access.guard()` in route `beforeLoad` to enforce permissions
- Admins bypass all policy checks

**Feature Modules** (`src/features/`):
- Each feature has `api/`, `components/`, `schemas.ts`
- Features cannot import from other features (enforced by eslint-plugin-boundaries)
- Import shared code from `components/`, `lib/`, `hooks/`, `utils/`

### Routing

- Underscore prefix (`_app`, `_auth`) = layout routes
- Parentheses `(routes)` = pathless grouping
- Route tree auto-generated in `routeTree.gen.ts` - never edit manually
- Router context provides `queryClient` and `session` (in `_app`)

### Code Style

- Use `import { z } from 'zod'` (not default import)
- `@/*` alias maps to `./src/*`
- shadcn/ui components in `components/ui/` (new-york style, DiceUI registry available)
