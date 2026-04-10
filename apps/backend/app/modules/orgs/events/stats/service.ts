import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters, csvUploads } from "#database/schema/org-events";
import { and, count, desc, eq, isNotNull } from "drizzle-orm";

@inject()
export class EventStatsService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string) {
    return this.db.use(async (db) => {
      const [coachCount] = await db
        .select({ v: count() })
        .from(eventRosters)
        .where(and(eq(eventRosters.eventId, eventId), eq(eventRosters.type, "coach")));

      const [dancerCount] = await db
        .select({ v: count() })
        .from(eventRosters)
        .where(and(eq(eventRosters.eventId, eventId), eq(eventRosters.type, "dancer")));

      const [registeredCount] = await db
        .select({ v: count() })
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            isNotNull(eventRosters.userId),
          ),
        );

      const recentUploads = await db
        .select()
        .from(csvUploads)
        .where(eq(csvUploads.eventId, eventId))
        .orderBy(desc(csvUploads.createdAt))
        .limit(5);

      const coaches = Number(coachCount?.v ?? 0);
      const dancers = Number(dancerCount?.v ?? 0);
      const registered = Number(registeredCount?.v ?? 0);

      return {
        coaches,
        dancers,
        registered,
        pending: coaches + dancers - registered,
        recentUploads,
      };
    });
  }
}
