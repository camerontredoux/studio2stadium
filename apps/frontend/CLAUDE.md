# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start development server (Vite)
pnpm build        # Type-check and build for production
pnpm lint         # Run ESLint
pnpm check        # Format with Prettier and fix ESLint issues
pnpm preview      # Preview production build
```

## Architecture

This is a React 19 SPA built with Vite, using TanStack Router for file-based routing and TanStack Query for data fetching.

### Tech Stack

- **React 19** with React Compiler (babel-plugin-react-compiler)
- **TanStack Router** - File-based routing with auto code-splitting
- **TanStack Query** - Server state management
- **Tailwind CSS v4** with shadcn/ui components (new-york style)
- **nuqs** - URL query state management via TanStack Router adapter

### Project Structure

```
src/
├── routes/           # TanStack file-based routes (auto-generates routeTree.gen.ts)
│   ├── __root.tsx    # Root layout with devtools
│   ├── _app/         # Main app layout (authenticated)
│   ├── _auth/        # Auth pages (login, signup, reset)
│   ├── _admin/       # Admin dashboard
│   ├── _account/     # Account settings
│   └── _vault/       # Vault section
├── components/
│   ├── ui/           # shadcn/ui primitives
│   ├── data-table/   # TanStack Table implementation
│   └── data-grid/    # Virtual data grid
├── hooks/            # Custom React hooks (use-data-table, use-data-grid)
├── utils/            # Utilities including cn() for class merging
├── types/            # TypeScript type definitions
├── config/           # Configuration files
└── features/         # Feature-specific modules
```

### Routing Patterns

- Underscore prefix (`_app`, `_auth`) indicates layout routes
- Routes export `Route` using `createFileRoute()` or `createRootRouteWithContext()`
- Router context provides `QueryClient` for data fetching
- Route tree is auto-generated in `routeTree.gen.ts` - do not edit manually

### Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig and vite.config.ts)

### Adding shadcn Components

Uses shadcn CLI with DiceUI registry support. Config in `components.json`:

- Style: new-york
- Icons: lucide-react
- CSS variables for theming in `src/index.css`
