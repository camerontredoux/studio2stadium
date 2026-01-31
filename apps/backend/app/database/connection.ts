import env from "#start/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { type DB } from "./generated/kysely/types.ts";
import { PrismaClient } from "./generated/prisma/client.ts";

const pool = new Pool({
  connectionString: env.get("DATABASE_URL"),
});

const dialect = new PostgresDialect({
  pool,
});

export const db = new Kysely<DB>({
  dialect,
});

const adapter = new PrismaPg({
  connectionString: env.get("DATABASE_URL"),
});

export const prisma = new PrismaClient({
  adapter,
});
