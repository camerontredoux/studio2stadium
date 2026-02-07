import env from "#start/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { relations } from "./schema/relations.ts";

const client = postgres(env.get("DATABASE_URL"), { prepare: false });

export const db = drizzle({
  client,
  relations,
  casing: "snake_case",
});
