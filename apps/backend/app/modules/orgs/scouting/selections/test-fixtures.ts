import { db } from "#database/connection";
import { eventSchoolSelections } from "#database/schema/event-features";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { and, asc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";

/**
 * Test data for the selections slices: an org with an active and an inactive
 * Org Event, two dancers and four coaches on the active one. Each call makes a
 * fresh org, and `cleanup` deletes it (events, rosters and selections cascade).
 */
export async function selectionFixture() {
  const suffix = randomUUID().slice(0, 8);
  const [org] = await db
    .insert(organizations)
    .values({ name: `Selections ${suffix}`, slug: `selections-${suffix}` })
    .returning();
  const [event, otherEvent] = await db
    .insert(orgEvents)
    .values([
      {
        orgId: org!.id,
        name: "Active Event",
        startDate: "2026-07-01",
        endDate: "2026-07-02",
        isActive: true,
      },
      {
        orgId: org!.id,
        name: "Past Event",
        startDate: "2025-07-01",
        endDate: "2025-07-02",
      },
    ])
    .returning();

  const roster = async (
    eventId: string,
    type: "dancer" | "coach",
    name: string,
    userId?: string
  ) => {
    const [row] = await db
      .insert(eventRosters)
      .values({
        eventId,
        userId,
        type,
        email: `${name.toLowerCase()}-${suffix}@test.co`,
        firstName: name,
        lastName: type === "coach" ? "Coach" : "Dancer",
        organization: type === "coach" ? `${name} University` : null,
      })
      .returning();
    return row!;
  };

  const coaches = await Promise.all(
    ["Alpha", "Bravo", "Charlie", "Delta"].map((name) =>
      roster(event!.id, "coach", name)
    )
  );

  return {
    org: org!,
    event: event!,
    otherEvent: otherEvent!,
    coaches,
    roster,
    /** Inserts selections for `dancerRosterId` ranked in the order given. */
    async select(
      eventId: string,
      dancerRosterId: string,
      coachRosterIds: string[]
    ) {
      if (coachRosterIds.length === 0) return [];
      return db
        .insert(eventSchoolSelections)
        .values(
          coachRosterIds.map((coachRosterId, index) => ({
            eventId,
            dancerRosterId,
            coachRosterId,
            rank: index + 1,
          }))
        )
        .returning();
    },
    /** The dancer's selections as `[coachRosterId, rank]` pairs, best first. */
    async ranks(eventId: string, dancerRosterId: string) {
      const rows = await db
        .select({
          coachRosterId: eventSchoolSelections.coachRosterId,
          rank: eventSchoolSelections.rank,
        })
        .from(eventSchoolSelections)
        .where(
          and(
            eq(eventSchoolSelections.eventId, eventId),
            eq(eventSchoolSelections.dancerRosterId, dancerRosterId)
          )
        )
        .orderBy(asc(eventSchoolSelections.rank));
      return rows.map((row) => [row.coachRosterId, row.rank] as const);
    },
    async cleanup() {
      await db
        .delete(organizations)
        .where(inArray(organizations.id, [org!.id]));
    },
  };
}

export type SelectionFixture = Awaited<ReturnType<typeof selectionFixture>>;
