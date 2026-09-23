import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import { orgEvents } from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { DatabaseService } from "#database/service";
import env from "#start/env";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { type Validator } from "./validator.ts";

export type CheckoutStatus =
  | {
      /**
       * Not provisioned yet. Stripe redirects the buyer back as soon as they
       * pay, which can be before the webhook has run — the page asks again.
       */
      status: "pending";
    }
  | {
      status: "provisioned";
      orgName: string;
      orgSlug: string;
      /** Where the Organizer signs in to run their Org (user story 15). */
      orgUrl: string;
      eventName: string;
    };

/**
 * What a buyer landing back from Checkout has, by the session they paid in.
 *
 * Unauthenticated, like the checkout it follows: the marketing site calls it
 * with the `session_id` Stripe put in the return URL. The session id is only
 * known to whoever paid in it, and all it reveals is an Org's public URL.
 */
@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator): Promise<CheckoutStatus> {
    const [row] = await this.db.use((db) =>
      db
        .select({
          orgName: organizations.name,
          orgSlug: organizations.slug,
          eventName: orgEvents.name,
        })
        .from(eventTierPurchases)
        .innerJoin(orgEvents, eq(orgEvents.id, eventTierPurchases.eventId))
        .innerJoin(organizations, eq(organizations.id, orgEvents.orgId))
        .where(eq(eventTierPurchases.reference, params.sessionId))
        .limit(1)
    );

    if (!row) return { status: "pending" };

    return {
      status: "provisioned",
      ...row,
      orgUrl: `${env.get("SITE_URL")}/o/${row.orgSlug}/admin`,
    };
  }
}
