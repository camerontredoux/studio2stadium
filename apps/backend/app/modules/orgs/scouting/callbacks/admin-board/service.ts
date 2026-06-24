import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventCallbacks } from "#database/schema/event-features";
import { eventRosters } from "#database/schema/org-events";
import { and, asc, count, countDistinct, eq, sql } from "drizzle-orm";

@inject()
export class AdminCallbackBoardService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, showcaseId: string) {
    const [bibs, stats] = await Promise.all([
      this.db.use((db) =>
        db
          .select({
            dancerRosterId: eventCallbacks.dancerRosterId,
            bibNumber: eventRosters.bibNumber,
            firstName: eventRosters.firstName,
            lastName: eventRosters.lastName,
            coachCount: count(eventCallbacks.id).as("coachCount"),
          })
          .from(eventCallbacks)
          .innerJoin(
            eventRosters,
            eq(eventRosters.id, eventCallbacks.dancerRosterId)
          )
          .where(
            and(
              eq(eventCallbacks.showcaseId, showcaseId),
              // Exclude staff sandboxes: skip staff dancers and any callback
              // authored by a staff (preview) coach roster.
              eq(eventRosters.isStaff, false),
              sql`NOT EXISTS (
                SELECT 1 FROM event_rosters cr
                WHERE cr.id = ${eventCallbacks.coachRosterId}
                  AND cr.is_staff = true
              )`
            )
          )
          .groupBy(
            eventCallbacks.dancerRosterId,
            eventRosters.bibNumber,
            eventRosters.firstName,
            eventRosters.lastName
          )
          .orderBy(asc(eventRosters.bibNumber))
      ),
      this.db.use((db) =>
        db
          .select({
            totalSchools: countDistinct(
              sql`CASE WHEN ${eventRosters.type} = 'coach' THEN ${eventRosters.id} END`
            ).as("totalSchools"),
            totalDancers: countDistinct(
              sql`CASE WHEN ${eventRosters.type} = 'dancer' THEN ${eventRosters.id} END`
            ).as("totalDancers"),
          })
          .from(eventRosters)
          .where(
            and(
              eq(eventRosters.eventId, eventId),
              eq(eventRosters.isStaff, false)
            )
          )
      ),
    ]);

    return {
      bibs,
      totalSchools: Number(stats[0]?.totalSchools ?? 0),
      totalDancers: Number(stats[0]?.totalDancers ?? 0),
      uniqueCallbacks: bibs.length,
    };
  }
}
