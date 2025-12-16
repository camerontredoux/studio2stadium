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
node ace test --files "app/features/users/signup/signup.spec.ts"  # Run single test file

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

### Feature-Based Structure

Features live in `app/features/{domain}/{feature-name}/` with co-located files:
- `*.controller.ts` - HTTP handler, validates input, calls service
- `*.service.ts` - Business logic, orchestrates queries
- `*.queries.ts` - Database queries extending `BaseQuery`
- `*.validator.ts` - VineJS validation schema
- `*.spec.ts` - Japa tests (functional tests live alongside features)
- `*.event.ts` - Domain events
- `*.routes.ts` - Route definitions (at domain level, e.g., `users.routes.ts`)

Routes are registered by importing the routes file in `start/routes.ts`.

### Database Layer

- **Prisma** (`database/prisma/schema.prisma`): Schema definition and migrations only
- **Kysely** (`database/connection.ts`): Query builder for all database operations
- **Types** (`database/generated/types.ts`): Auto-generated from Prisma via `prisma-kysely`

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

### Authentication

Session-based auth with Redis storage. User data is cached in Redis for 2 hours (`providers/session-user.ts`). The `SessionUserProvider` handles user lookup and caching.

Named middleware in `start/kernel.ts`:
- `auth` - Requires authenticated user
- `subscribed` - Requires active subscription
- `prodigy` - Requires prodigy platform access

### Path Aliases

Use import aliases defined in `package.json`:
- `#features/*` - `app/features/*.ts`
- `#database/*` - `database/*.ts`
- `#shared/*` - `app/shared/*.ts`
- `#middleware/*` - `app/middleware/*.ts`
- `#providers/*` - `providers/*.ts`
- `#start/*` - `start/*.ts`
- `#repositories/*` - `app/repositories/*.ts`

### Testing

Tests use Japa with functional tests in `app/features/**/*.spec.ts`. Test setup clears database tables in `group.each.setup()`. Use `@faker-js/faker` for test data.

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
