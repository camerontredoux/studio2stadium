import type { Transaction } from "#database/service";
import { eventSchoolSelections } from "#database/schema/event-features";
import { eventRosters } from "#database/schema/org-events";
import { and, eq, gt, inArray, lt, sql } from "drizzle-orm";

/**
 * Serializes every write to one dancer's selections. Add, remove and move all
 * read the current ranks and then write new ones, so two at once would hand
 * out the same rank. `no key update` still lets other rows reference the
 * Roster Entry while the lock is held.
 */
export async function lockDancerSelections(
  tx: Transaction,
  dancerRosterId: string
) {
  await tx
    .select({ id: eventRosters.id })
    .from(eventRosters)
    .where(eq(eventRosters.id, dancerRosterId))
    .for("no key update");
}

/**
 * Moves every rank after `removedRank` up by one, so ranks stay 1..n. The
 * unique index on rank is checked row by row, so the shifted rows go through
 * negative values first; a single `rank - 1` could collide mid-statement.
 */
export async function closeRankGap(
  tx: Transaction,
  eventId: string,
  dancerRosterId: string,
  removedRank: number
) {
  const owner = and(
    eq(eventSchoolSelections.eventId, eventId),
    eq(eventSchoolSelections.dancerRosterId, dancerRosterId)
  );
  await tx
    .update(eventSchoolSelections)
    .set({ rank: sql`-(${eventSchoolSelections.rank} - 1)` })
    .where(and(owner, gt(eventSchoolSelections.rank, removedRank)));
  await tx
    .update(eventSchoolSelections)
    .set({ rank: sql`-${eventSchoolSelections.rank}` })
    .where(and(owner, lt(eventSchoolSelections.rank, 0)));
}

/** Swaps the ranks of two selections, through negative values for the unique index. */
export async function swapRanks(
  tx: Transaction,
  a: { id: string; rank: number },
  b: { id: string; rank: number }
) {
  const ids = inArray(eventSchoolSelections.id, [a.id, b.id]);
  await tx
    .update(eventSchoolSelections)
    .set({ rank: sql`-${eventSchoolSelections.rank}` })
    .where(ids);
  await tx
    .update(eventSchoolSelections)
    .set({
      rank: sql`case when ${eventSchoolSelections.id} = ${a.id} then ${b.rank}::int else ${a.rank}::int end`,
    })
    .where(ids);
}
