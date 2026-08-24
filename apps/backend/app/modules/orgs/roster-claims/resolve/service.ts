import { DatabaseService } from "#database/service";
import {
  eventRosters,
  orgEvents,
  rosterClaimRequests,
} from "#database/schema/org-events";
import { AttachAccountService } from "#modules/orgs/events/rosters/attach/service";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";

export class ClaimNotFoundError extends Error {
  code = "CLAIM_NOT_FOUND" as const;
  constructor() {
    super("Claim request not found or already resolved.");
  }
}

export class ClaimRosterMismatchError extends Error {
  code = "CLAIM_ROSTER_MISMATCH" as const;
  constructor() {
    super("That roster entry does not belong to this organization.");
  }
}

@inject()
export class ResolveRosterClaimService {
  constructor(
    private db: DatabaseService = new DatabaseService(),
    private attachService: AttachAccountService = new AttachAccountService()
  ) {}

  /**
   * Approving performs the same reassignment an admin would do by hand, through
   * the same guarded service — the claim is the paper trail for *why*, not a
   * second way to mutate a roster. `confirmRelink` is passed because approving
   * a claim is itself the deliberate confirmation.
   */
  async approve(orgId: string, claimId: string, rosterId: string, actorId: string) {
    const claim = await this.loadPending(orgId, claimId);

    const [roster] = await this.db.use((db) =>
      db
        .select({ id: eventRosters.id, eventId: eventRosters.eventId })
        .from(eventRosters)
        .innerJoin(orgEvents, eq(orgEvents.id, eventRosters.eventId))
        .where(and(eq(eventRosters.id, rosterId), eq(orgEvents.orgId, orgId)))
        .limit(1)
    );
    if (!roster) throw new ClaimRosterMismatchError();

    const updated = await this.attachService.attach(
      roster.eventId,
      roster.id,
      claim.requesterId,
      actorId,
      true
    );

    await this.db.use((db) =>
      db
        .update(rosterClaimRequests)
        .set({
          status: "approved",
          resolvedRosterId: roster.id,
          resolvedBy: actorId,
          resolvedAt: new Date(),
        })
        .where(eq(rosterClaimRequests.id, claimId))
    );

    return updated;
  }

  async reject(orgId: string, claimId: string, actorId: string) {
    await this.loadPending(orgId, claimId);

    await this.db.use((db) =>
      db
        .update(rosterClaimRequests)
        .set({
          status: "rejected",
          resolvedBy: actorId,
          resolvedAt: new Date(),
        })
        .where(eq(rosterClaimRequests.id, claimId))
    );

    return { id: claimId, status: "rejected" as const };
  }

  private async loadPending(orgId: string, claimId: string) {
    const [claim] = await this.db.use((db) =>
      db
        .select()
        .from(rosterClaimRequests)
        .where(
          and(
            eq(rosterClaimRequests.id, claimId),
            eq(rosterClaimRequests.orgId, orgId),
            eq(rosterClaimRequests.status, "pending")
          )
        )
        .limit(1)
    );
    if (!claim) throw new ClaimNotFoundError();
    return claim;
  }
}
