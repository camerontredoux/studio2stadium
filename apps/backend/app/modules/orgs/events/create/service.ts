import { DatabaseService } from "#database/service";
import { orgEvents } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import type { Validator } from "./validator.ts";

@inject()
export class CreateEventService {
  constructor(private db: DatabaseService) {}

  async execute(orgId: string, input: Validator) {
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
      return ev!;
    });
  }
}
