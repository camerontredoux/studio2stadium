import * as pg from "drizzle-orm/pg-core";
import { timestamps } from "./helpers/columns.ts";

/**
 * One row per scheduled job tick that actually executed.
 *
 * `#start/cron` is preloaded on every Fly machine, so each schedule fires once
 * per machine. Inserting `(job, runKey)` under a unique constraint elects a
 * single winner per tick: the machine whose insert returns a row runs the job,
 * the others get nothing back and skip.
 *
 * A session-level advisory lock cannot do this here — DATABASE_URL is
 * Supabase's transaction-mode pooler, which may route each statement outside a
 * transaction to a different server connection, so the unlock would miss the
 * connection holding the lock and leak it permanently.
 *
 * Append-only, and gains roughly fourteen rows a year, so it needs no pruning.
 */
export const cronJobRuns = pg.pgTable(
  "cron_job_runs",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    job: pg.text().notNull(),
    runKey: pg.text().notNull(),
    ...timestamps,
  },
  (table) => [pg.uniqueIndex().on(table.job, table.runKey)]
);
