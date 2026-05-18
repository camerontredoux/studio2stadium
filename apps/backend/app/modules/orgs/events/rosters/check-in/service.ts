import { DatabaseService } from "#database/service";
import { eventRosters } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, eq, sql } from "drizzle-orm";

export class RosterNotFoundError extends Error {
  constructor() {
    super("Roster entry not found.");
  }
}

@inject()
export class AdminCheckInService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, rosterId: string, actorId: string) {
    return this.db.withAudit(
      { eventId, actorId },
      async (tx, audit) => {
        const [roster] = await tx
          .select({
            id: eventRosters.id,
            checkedInAt: eventRosters.checkedInAt,
          })
          .from(eventRosters)
          .where(
            and(
              eq(eventRosters.id, rosterId),
              eq(eventRosters.eventId, eventId),
            ),
          );

        if (!roster) throw new RosterNotFoundError();

        const newValue = roster.checkedInAt ? null : sql`NOW()`;

        const [updated] = await tx
          .update(eventRosters)
          .set({ checkedInAt: newValue })
          .where(eq(eventRosters.id, rosterId))
          .returning();

        audit.log({
          action: "update",
          resource: "roster",
          resourceId: rosterId,
          metadata: {
            field: "checkedInAt",
            before: roster.checkedInAt,
            after: updated.checkedInAt,
          },
        });

        return updated;
      },
    );
  }
}
