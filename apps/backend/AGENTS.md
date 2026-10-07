# Backend

Guidance for `apps/backend`. Monorepo structure, infrastructure, and cross-app flow are in the root `AGENTS.md`.

## Commands

```bash
# Development
pnpm dev              # Start dev server with HMR
pnpm build            # Build for production
pnpm start            # Run production server

# Testing
pnpm test                           # Run all tests
node ace test --files "app/modules/event-tiers/checkout/service.spec.ts"  # Run single test file

# Database
pnpm db:generate      # Generate migration from schema changes
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema directly (no migration)
pnpm db:reset         # Reset database
pnpm db:studio        # Open Drizzle Studio
pnpm db:seed          # Seed database with test data

# Code Quality
pnpm lint             # ESLint
pnpm format           # Prettier
pnpm typecheck        # TypeScript check

# Code Generation
pnpm make:docs        # Generate Tuyau API docs and OpenAPI spec
```

## Architecture

AdonisJS 6 backend using Drizzle ORM with PostgreSQL.

### Module-Based Structure

Features live in `app/modules/{domain}/{feature-name}/` with co-located files:

- `controller.ts` - HTTP handler with `@inject()` decorator, validates input, calls service
- `service.ts` - Business logic, injects `DatabaseService` for queries
- `validator.ts` - VineJS validation schema, exports `Validator` type
- `event.ts` - Domain events (optional)
- `routes.ts` - Route definitions at domain level (e.g., `auth/routes.ts`)

Routes are registered by importing in `start/routes.ts`.

### Database Layer

- **Drizzle ORM** (`app/database/connection.ts`): Query builder, exports `db`
- **Schema** (`app/database/schema/*.ts`): Table definitions using `drizzle-orm/pg-core`
- **Relations** (`app/database/schema/relations.ts`): Drizzle relation definitions
- **DatabaseService** (`app/database/service.ts`): Wrapper with PostgreSQL error handling

After schema changes: `pnpm db:generate` then `pnpm db:migrate`.

### Query Pattern

Services inject `DatabaseService` for database operations with automatic error handling:

```typescript
@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(input: Validator) {
    // Simple query
    return await this.db.use((db) =>
      db.select().from(users).where(eq(users.id, input.id))
    );
  }

  async createWithTransaction(input: Validator) {
    // Transaction
    return await this.db.tx(async (tx) => {
      const [user] = await tx.insert(users).values(input).returning();
      await tx.insert(platforms).values({ userId: user.id });
      return user;
    });
  }
}
```

For simple queries without error handling, import `db` directly from `#database/connection`.

### Authentication & Session Caching

Session-based auth with Redis sessions and a multi-layer caching strategy.

**Cache Layers (checked in order):**

1. **Cookie cache** - Short-lived signed cookie for GET requests (stateless, no Redis hit)
2. **Redis session** - User data with version, validated against Redis
3. **Database** - Full query (on version mismatch or cache miss)

**Cookie Cache Design:**
The cookie cache is intentionally stateless. During its TTL, it never hits Redis — this is by design for performance. It does NOT participate in version-based invalidation. GET requests may use slightly stale user data until the cookie expires. State-changing requests (POST/PUT/DELETE) always validate against Redis.

**Version-Based Invalidation:**
Redis stores `version:{userId}` as an invalidation key. The Redis session stores this version; on mismatch, the session is refreshed from the database. Calling `guard.bump()` invalidates Redis sessions across all devices.

**Named Middleware** (`start/kernel.ts`, which has the full list):

- `auth` - Requires authenticated user
- `admin` - Requires a platform admin
- `dancer` - Requires dancer profile access
- `school` - Requires school profile access
- `subscribed` - Requires premium entitlement: an active subscription or a Premium Grant
- `profile` - Requires any profile type
- `org*` (`orgMember`, `orgAdmin`, `orgCoach`, `orgEvent`, and others) - Org and Org Event access

### Path Aliases

Use import aliases defined in `package.json`:

- `#modules/*` - `app/modules/*.ts`
- `#database/*` - `app/database/*.ts`
- `#utils/*` - `app/utils/*.ts`
- `#middleware/*` - `app/middleware/*.ts`
- `#exceptions/*` - `app/exceptions/*.ts`
- `#auth/*` - `app/auth/*.ts`
- `#shared/*` - `app/shared/*.ts`
- `#payments/*` - `app/payments/*.ts`
- `#commands/*` - `commands/*.ts`
- `#start/*` - `start/*.ts`
- `#config/*` - `config/*.ts`

The other aliases in `package.json` (`#controllers`, `#models`, `#services`, `#events`, `#listeners`, and similar) are AdonisJS defaults that point at directories that do not exist. The top-level `services/` (cron job classes) is not aliased; import it by relative path.

### Testing

Tests use Japa. Most are co-located in the feature slice as `service.spec.ts`, `validator.spec.ts`, and `routes.spec.ts`; the `functional` suite in `adonisrc.ts` lists every glob it runs. Use `@faker-js/faker` for test data.

```typescript
test.group("Feature tests", (group) => {
  group.each.setup(async () => {
    await db.delete(table).execute();
  });

  test("description", async ({ client }) => {
    const response = await client.post("/endpoint").json({ ... });
    response.assertStatus(201);
  });
});
```
