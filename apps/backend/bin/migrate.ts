/*
|--------------------------------------------------------------------------
| Migration runner
|--------------------------------------------------------------------------
|
| Standalone entry point used by the Fly `release_command` to apply pending
| Drizzle migrations before a new release goes live. It uses the drizzle-orm
| migrator (a production dependency) rather than drizzle-kit, so it works
| inside the pruned production image where devDependencies are unavailable.
|
| The migration SQL is shipped into the build via the `metaFiles` entry in
| adonisrc.ts, so `../app/database/drizzle` resolves at runtime.
|
*/

import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate] DATABASE_URL is not set");
  process.exit(1);
}

const migrationsFolder = fileURLToPath(
  new URL("../app/database/drizzle", import.meta.url),
);

// `prepare: false` matches app/database/connection.ts so this works against
// the Supabase transaction pooler (pgbouncer), which rejects prepared statements.
const client = postgres(url, { prepare: false, max: 1 });
const db = drizzle({ client });

try {
  console.log("[migrate] applying pending migrations...");
  await migrate(db, { migrationsFolder });
  console.log("[migrate] migrations applied successfully");
} catch (error) {
  console.error("[migrate] failed:", error);
  process.exitCode = 1;
} finally {
  await client.end();
}
