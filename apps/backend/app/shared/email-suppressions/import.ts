import { db } from "#database/connection";
import {
  emailSuppressions,
  type SuppressionSource,
} from "#database/schema/week-pass-emails";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { SuppressionRecord } from "./parse.ts";

const CHUNK = 500;

export interface ImportCounts {
  /** Addresses this source has no row for yet. */
  added: number;
  /** Rows for this source whose reason or date this file brings up to date. */
  refreshed: number;
  /** Rows already saying the same, or something newer. */
  unchanged: number;
  /** Of the added, addresses another source already suppresses. */
  alreadySuppressedElsewhere: number;
}

type Existing = { reason: string; sourceRecordedAt: Date | null };

/** Whether `incoming` should replace what is stored for its address. */
function changes(existing: Existing, incoming: SuppressionRecord): boolean {
  const same =
    existing.reason === incoming.reason &&
    (existing.sourceRecordedAt?.getTime() ?? null) ===
      (incoming.sourceRecordedAt?.getTime() ?? null);
  if (same) return false;
  // Never let an older statement overwrite a newer one.
  if (existing.sourceRecordedAt && incoming.sourceRecordedAt) {
    return incoming.sourceRecordedAt >= existing.sourceRecordedAt;
  }
  return true;
}

function chunks<T>(items: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += CHUNK) {
    out.push(items.slice(i, i + CHUNK));
  }
  return out;
}

type Reader = Pick<typeof db, "select">;

async function plan(
  reader: Reader,
  source: SuppressionSource,
  records: SuppressionRecord[]
): Promise<{ counts: ImportCounts; write: SuppressionRecord[] }> {
  const counts: ImportCounts = {
    added: 0,
    refreshed: 0,
    unchanged: 0,
    alreadySuppressedElsewhere: 0,
  };
  const write: SuppressionRecord[] = [];

  for (const chunk of chunks(records)) {
    const emails = chunk.map((r) => r.email);
    const rows = await reader
      .select({
        email: emailSuppressions.email,
        source: emailSuppressions.source,
        reason: emailSuppressions.reason,
        sourceRecordedAt: emailSuppressions.sourceRecordedAt,
      })
      .from(emailSuppressions)
      .where(inArray(emailSuppressions.email, emails));

    const own = new Map<string, Existing>();
    const elsewhere = new Set<string>();
    for (const row of rows) {
      const key = row.email.toLowerCase();
      if (row.source === source) own.set(key, row);
      else elsewhere.add(key);
    }

    for (const record of chunk) {
      const existing = own.get(record.email);
      if (!existing) {
        counts.added++;
        if (elsewhere.has(record.email)) counts.alreadySuppressedElsewhere++;
        write.push(record);
      } else if (changes(existing, record)) {
        counts.refreshed++;
        write.push(record);
      } else {
        counts.unchanged++;
      }
    }
  }
  return { counts, write };
}

/**
 * What applying these records would do. Reads only.
 */
export async function previewSuppressionImport(
  source: SuppressionSource,
  records: SuppressionRecord[]
): Promise<ImportCounts> {
  const { counts } = await plan(db, source, records);
  return counts;
}

/**
 * Add or refresh these records in one transaction: all of them, or none if
 * anything fails. Never deletes, and never touches another source's rows.
 * Running the same file again changes nothing.
 */
export async function applySuppressionImport(
  source: SuppressionSource,
  records: SuppressionRecord[]
): Promise<ImportCounts> {
  if (records.some((r) => r.source !== source)) {
    throw new Error("Every record must come from the source being imported");
  }

  return await db.transaction(async (tx) => {
    // One import per source at a time.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`email-suppressions:${source}`}))`
    );
    const { counts, write } = await plan(tx, source, records);

    for (const chunk of chunks(write)) {
      await tx
        .insert(emailSuppressions)
        .values(chunk)
        .onConflictDoUpdate({
          target: [emailSuppressions.email, emailSuppressions.source],
          set: {
            reason: sql`excluded.reason`,
            sourceRecordedAt: sql`excluded.source_recorded_at`,
            updatedAt: sql`now()`,
          },
        });
    }
    return counts;
  });
}

/** Rows a source holds, for checks after an import. */
export async function countSuppressions(source: SuppressionSource) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emailSuppressions)
    .where(and(eq(emailSuppressions.source, source)));
  return row?.count ?? 0;
}
