import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventCallbacks } from "#database/schema/event-features";
import { eventRosters } from "#database/schema/org-events";
import { asc, count, countDistinct, eq, sql } from "drizzle-orm";

@inject()
export class AdminCallbackBoardService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string) {
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
          .where(eq(eventCallbacks.eventId, eventId))
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
          .where(eq(eventRosters.eventId, eventId))
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
