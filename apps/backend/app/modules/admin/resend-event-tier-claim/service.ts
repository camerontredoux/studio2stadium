import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import { orgEvents } from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { emailClaimLink } from "#modules/event-tiers/claim/notify";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { type Validator } from "./validator.ts";

/** The purchase is not waiting for its buyer to claim it. */
export class NotAwaitingClaimError extends Error {}

/**
 * The claim email did not go. Already logged and reported to Sentry; raised so
 * staff are told to try again rather than shown a success.
 */
export class ClaimEmailNotSentError extends Error {}

/**
 * Send a purchase's buyer a fresh claim link (ADR 0007), for a buyer who lost
 * the first email or let it expire. The fresh link replaces the earlier one.
 * Only for a purchase still awaiting its claim: the link goes to the account's
 * own address, as it always does, so staff never hand anyone else access.
 *
 * Returns false when there is no such purchase.
 */
@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator): Promise<boolean> {
    const [row] = await this.db.use((db) =>
      db
        .select({
          claimRequired: eventTierPurchases.claimRequired,
          claimedAt: eventTierPurchases.claimedAt,
          buyer: {
            id: users.id,
            firstName: users.firstName,
            email: users.displayEmail,
          },
          org: { name: organizations.name, slug: organizations.slug },
          event: { name: orgEvents.name },
        })
        .from(eventTierPurchases)
        .innerJoin(users, eq(users.id, eventTierPurchases.buyerId))
        .innerJoin(orgEvents, eq(orgEvents.id, eventTierPurchases.eventId))
        .innerJoin(organizations, eq(organizations.id, orgEvents.orgId))
        .where(eq(eventTierPurchases.id, params.id))
        .limit(1)
    );

    if (!row) return false;

    if (!row.claimRequired || row.claimedAt) {
      throw new NotAwaitingClaimError("This purchase is not awaiting a claim");
    }

    if (!(await emailClaimLink(row))) {
      throw new ClaimEmailNotSentError(
        "The claim email could not be sent. Try again."
      );
    }

    return true;
  }
}
