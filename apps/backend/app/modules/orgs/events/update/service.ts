import { DatabaseService } from "#database/service";
import { orgEvents } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, eq, ne } from "drizzle-orm";
import type { Validator } from "./validator.ts";

@inject()
export class UpdateEventService {
  constructor(private db: DatabaseService) {}

  async execute(orgId: string, eventId: string, patch: Validator) {
    return this.db.tx(async (tx) => {
      // If activating this event, deactivate any other active event first
      if (patch.isActive === true) {
        await tx.update(orgEvents)
          .set({ isActive: false })
          .where(and(eq(orgEvents.orgId, orgId), eq(orgEvents.isActive, true), ne(orgEvents.id, eventId)));
      }
      const [ev] = await tx.update(orgEvents)
        .set({
          ...(patch.name !== undefined && { name: patch.name }),
          ...(patch.startDate !== undefined && { startDate: patch.startDate }),
          ...(patch.endDate !== undefined && { endDate: patch.endDate }),
          ...(patch.venueName !== undefined && { venueName: patch.venueName }),
          ...(patch.venueAddress !== undefined && { venueAddress: patch.venueAddress }),
          ...(patch.contactEmail !== undefined && { contactEmail: patch.contactEmail }),
          ...(patch.schedulePdfUrl !== undefined && { schedulePdfUrl: patch.schedulePdfUrl }),
          ...(patch.isActive !== undefined && { isActive: patch.isActive }),
        })
        .where(and(eq(orgEvents.id, eventId), eq(orgEvents.orgId, orgId)))
        .returning();
      return ev ?? null;
    });
  }
}
