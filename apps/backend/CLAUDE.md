# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev              # Start dev server with HMR
pnpm build            # Build for production
pnpm start            # Run production server

# Testing
pnpm test                           # Run all tests
node ace test --files "app/modules/users/signup/test.ts"  # Run single test file

# Database
pnpm db:migrate       # Run migrations (dev)
pnpm db:deploy        # Run migrations (production)
pnpm db:generate      # Generate Kysely types from Prisma schema
pnpm db:push          # Push schema without migrations
pnpm db:reset         # Reset database
pnpm db:studio        # Open Prisma Studio

# Code Quality
pnpm lint             # ESLint
pnpm format           # Prettier
pnpm typecheck        # TypeScript check

# Code Generation
pnpm make:feature     # Generate new feature scaffold
pnpm make:docs        # Generate Tuyau API docs
pnpm make:spec        # Generate OpenAPI spec
```

## Architecture

This is an AdonisJS 6 backend using Kysely as the query builder with Prisma for migrations and type generation.

### Module-Based Structure

Features live in `app/modules/{domain}/{feature-name}/` with co-located files:
- `controller.ts` - HTTP handler, validates input, calls service
- `service.ts` - Business logic, orchestrates queries
- `queries.ts` - Database queries extending `BaseQuery`
- `validator.ts` - VineJS validation schema
- `test.ts` - Japa tests (functional tests live alongside features)
- `event.ts` - Domain events
- `routes.ts` - Route definitions (at domain level, e.g., `users/routes.ts`)

Routes are registered by importing the routes file in `start/routes.ts`.

### Database Layer

- **Prisma** (`app/database/prisma/schema.prisma`): Schema definition and migrations only
- **Kysely** (`app/database/connection.ts`): Query builder for all database operations
- **Types** (`app/database/generated/types.ts`): Auto-generated from Prisma via `prisma-kysely`

After schema changes: `pnpm db:migrate` then `pnpm db:generate` to update types.

### Query Pattern

All query classes extend `BaseQuery` which provides:
- `use(fn)` - Wraps queries with automatic PostgreSQL error handling
- `transaction(fn)` - Transaction support with error handling
- Auto-injection of `HttpContext` for error reporting

```typescript
export class FeatureQueries extends BaseQuery {
  async findSomething(id: string) {
    return await this.use((db) =>
      db.selectFrom("table").where("id", "=", id).executeTakeFirst()
    );
  }
}
```

### Authentication & Session Caching

Session-based auth with Redis sessions and a multi-layer caching strategy.

**Cache Layers (checked in order):**
1. **Cookie cache** - Short-lived encrypted cookie for fast GET requests
2. **Session cache** - User data stored in Redis session with version
3. **Database** - Full query with roles (cache miss)

**Version-Based Invalidation:**
Redis stores `session:version:{userId}` as a global invalidation key. Both cookie and session caches store this version. On each request, the cached version is compared against Redis - mismatch triggers a database query and cache update.

This enables **cross-session invalidation**: calling `guard.refresh()` bumps the Redis version, invalidating ALL sessions/devices for that user with a single O(1) operation.

**Named Middleware** (`start/kernel.ts`):
- `auth` - Requires authenticated user
- `subscribed` - Requires active subscription
- `prodigy` - Requires prodigy platform access

### Path Aliases

Use import aliases defined in `package.json`:
- `#modules/*` - `app/modules/*.ts`
- `#database/*` - `app/database/*.ts`
- `#utils/*` - `app/utils/*.ts`
- `#middleware/*` - `app/middleware/*.ts`
- `#auth/*` - `app/auth/*.ts`
- `#start/*` - `start/*.ts`
- `#config/*` - `config/*.ts`

### Testing

Tests use Japa with functional tests in `app/modules/**/*.test.ts`. Test setup clears database tables in `group.each.setup()`. Use `@faker-js/faker` for test data.

```typescript
test.group("Feature tests", (group) => {
  group.each.setup(async () => {
    await db.deleteFrom("table").execute();
  });

  test("description", async ({ client }) => {
    const response = await client.post("/endpoint").json({ ... });
    response.assertStatus(201);
  });
});
```
