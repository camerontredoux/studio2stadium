import { DatabaseService } from "#database/service";
import { orgEvents } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import type { Validator } from "./validator.ts";
import { AuditCollector } from "#database/audit";

@inject()
export class CreateEventService {
  constructor(private db: DatabaseService) {}

  async execute(orgId: string, input: Validator, actorId: string) {
    // Create the event first in a transaction, then log the audit entry
    // using the new event's id as the eventId context
    return this.db.tx(async (tx) => {
      const [ev] = await tx.insert(orgEvents).values({
        orgId,
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
        venueName: input.venueName,
        venueAddress: input.venueAddress,
        contactEmail: input.contactEmail,
        isActive: input.isActive ?? false,
      }).returning();

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
