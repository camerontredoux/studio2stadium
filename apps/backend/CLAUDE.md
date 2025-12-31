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

1. **Cookie cache** - Short-lived signed cookie for GET requests (stateless, no Redis hit)
2. **Redis session** - User data with version, validated against Redis
3. **Database** - Full query (on version mismatch or cache miss)

**Cookie Cache Design:**
The cookie cache is intentionally stateless, modeled after [BetterAuth's cookie cache](https://www.better-auth.com/docs/concepts/session-management#cookie-cache). During its TTL (5 min), it never hits Redis — this is by design for performance. It does NOT participate in version-based invalidation. This is an accepted tradeoff: GET requests may use slightly stale user data until the cookie expires. State-changing requests (POST/PUT/DELETE) always validate against Redis.

**Version-Based Invalidation (Redis session only):**
Redis stores `version:{userId}` as an invalidation key. The Redis session stores this version; on mismatch, the session is refreshed from the database. Calling `guard.refresh()` bumps the version, invalidating Redis sessions across all devices.

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
