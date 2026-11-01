import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters, csvUploads } from "#database/schema/org-events";
import { and, count, desc, eq, isNotNull, isNull } from "drizzle-orm";

@inject()
export class EventStatsService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string) {
    return this.db.use(async (db) => {
      // All counts derived from eventRosters.userId per activation semantics:
      // activated = userId IS NOT NULL, pending = userId IS NULL.
      // Staff "view-as" rows are preview sandboxes owned by admins, never
      // participants, so they are excluded from every count below.
      const [coachActivated] = await db
        .select({ v: count() })
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.type, "coach"),
            eq(eventRosters.isStaff, false),
            isNotNull(eventRosters.userId)
          )
        );

      const [coachPending] = await db
        .select({ v: count() })
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.type, "coach"),
            eq(eventRosters.isStaff, false),
            isNull(eventRosters.userId)
          )
        );

      const [dancerActivated] = await db
        .select({ v: count() })
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.type, "dancer"),
            eq(eventRosters.isStaff, false),
            isNotNull(eventRosters.userId)
          )
        );

      const [dancerPending] = await db
        .select({ v: count() })
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.type, "dancer"),
            eq(eventRosters.isStaff, false),
            isNull(eventRosters.userId)
          )
        );

      const recentUploads = await db
        .select()
        .from(csvUploads)
        .where(eq(csvUploads.eventId, eventId))
        .orderBy(desc(csvUploads.createdAt))
        .limit(5);

      const coachActivatedN = Number(coachActivated?.v ?? 0);
      const coachPendingN = Number(coachPending?.v ?? 0);
      const dancerActivatedN = Number(dancerActivated?.v ?? 0);
      const dancerPendingN = Number(dancerPending?.v ?? 0);

      const coaches = {
        activated: coachActivatedN,
        pending: coachPendingN,
        total: coachActivatedN + coachPendingN,
      };
      const dancers = {
        activated: dancerActivatedN,
        pending: dancerPendingN,
        total: dancerActivatedN + dancerPendingN,
      };

      return {
        coaches,
        dancers,
        // Flat aliases kept for any consumers that haven't migrated yet
        registered: dancerActivatedN + coachActivatedN,
        pending: dancerPendingN + coachPendingN,
        recentUploads,
      };
    });
  }
}
