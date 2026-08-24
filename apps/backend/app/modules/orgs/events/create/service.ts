import { DatabaseService } from "#database/service";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { users } from "#database/schema/users";
import { inject } from "@adonisjs/core";
import type { Validator } from "./validator.ts";
import { AuditCollector } from "#database/audit";
import { eq } from "drizzle-orm";

@inject()
export class CreateEventService {
  constructor(private db: DatabaseService) {}

  async execute(orgId: string, input: Validator, actorId: string) {
    // Create the event first in a transaction, then log the audit entry
    // using the new event's id as the eventId context
    return this.db.tx(async (tx) => {
      const [ev] = await tx
        .insert(orgEvents)
        .values({
          orgId,
          name: input.name,
          startDate: input.startDate,
          endDate: input.endDate,
          venueName: input.venueName,
          venueAddress: input.venueAddress,
          contactEmail: input.contactEmail,
          isActive: input.isActive ?? false,
        })
        .returning();

      const [actor] = await tx
        .select({
          displayEmail: users.displayEmail,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.id, actorId))
        .limit(1);

      // The creator is an Organizer running the event, not a participant in it
      // (ADR 0003). Seed the row as a staff/preview roster so it anchors FKs and
      // matches what "view as coach" would provision, while staying out of every
      // participant-facing and aggregate query.
      if (actor) {
        await tx.insert(eventRosters).values({
          eventId: ev!.id,
          userId: actorId,
          type: "coach",
          email: actor.displayEmail,
          firstName: actor.firstName,
          lastName: actor.lastName,
          isStaff: true,
        });
      }

      const audit = new AuditCollector();
      audit.log({
        action: "create",
        resource: "event",
        resourceId: ev!.id,
        metadata: { after: ev },
      });
      await audit.flush(tx, { eventId: ev!.id, actorId });

      return ev!;
    });
  }
}
