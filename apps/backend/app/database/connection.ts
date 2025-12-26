import env from "#start/env";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { type DB } from "./generated/types.ts";

const pool = new Pool({
  connectionString: env.get("DATABASE_URL"),
});

const dialect = new PostgresDialect({
  pool,
});

export const db = new Kysely<DB>({
  dialect,
});
