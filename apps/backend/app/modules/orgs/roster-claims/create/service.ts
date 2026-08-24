import { DatabaseService } from "#database/service";
import {
  eventRosters,
  orgEvents,
  rosterClaimRequests,
} from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, eq, inArray } from "drizzle-orm";
import type { CreateClaimValidator } from "./validator.ts";

export class AlreadyOnRosterError extends Error {
  code = "ALREADY_ON_ROSTER" as const;
  constructor() {
    super("This account is already linked to a roster entry for this event.");
  }
}

@inject()
export class CreateRosterClaimService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(orgId: string, requesterId: string, input: CreateClaimValidator) {
    return this.db.use(async (db) => {
      // Nothing to claim if she can already see her registration — this is the
      // path for dancers who find nothing, and saying so is more useful than
      // queuing a request an admin would only close again.
      const [existing] = await db
        .select({ id: eventRosters.id })
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.userId, requesterId),
            inArray(
              eventRosters.eventId,
              db
                .select({ id: orgEvents.id })
                .from(orgEvents)
                .where(eq(orgEvents.orgId, orgId))
            )
          )
        )
        .limit(1);
      if (existing) throw new AlreadyOnRosterError();

      // Re-submitting refreshes the open request rather than adding another,
      // so an anxious dancer cannot bury the admin queue.
      const [claim] = await db
        .insert(rosterClaimRequests)
        .values({
          orgId,
          requesterId,
          claimedFirstName: input.claimedFirstName,
          claimedLastName: input.claimedLastName,
          claimedEmail: input.claimedEmail ?? null,
          note: input.note ?? null,
        })
        .onConflictDoUpdate({
          target: [rosterClaimRequests.orgId, rosterClaimRequests.requesterId],
          targetWhere: eq(rosterClaimRequests.status, "pending"),
          set: {
            claimedFirstName: input.claimedFirstName,
            claimedLastName: input.claimedLastName,
            claimedEmail: input.claimedEmail ?? null,
            note: input.note ?? null,
            updatedAt: new Date(),
          },
        })
        .returning();

      return claim;
    });
  }
}
