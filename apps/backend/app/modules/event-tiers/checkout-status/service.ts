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
      /**
       * How the buyer gets in. `set_password` when the purchase created their
       * account — the page says to check their email for the set-password
       * link; `sign_in` when they already had one.
       */
      nextStep: "set_password" | "sign_in";
    };

/**
 * What a buyer landing back from Checkout has, by the session they paid in.
 *
 * Unauthenticated, like the checkout it follows: the marketing site calls it
 * with the `session_id` Stripe put in the return URL. The session id is only
 * known to whoever paid in it. It reveals an Org's public URL and whether the
 * purchase created the buyer's account, and never the buyer's email: the only
 * account it says anything about is the one the caller paid with, after a paid
 * checkout, so it cannot be used to probe whether some address has an account.
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
          buyerAccountCreated: eventTierPurchases.buyerAccountCreated,
        })
        .from(eventTierPurchases)
        .innerJoin(orgEvents, eq(orgEvents.id, eventTierPurchases.eventId))
        .innerJoin(organizations, eq(organizations.id, orgEvents.orgId))
        .where(eq(eventTierPurchases.reference, params.sessionId))
        .limit(1)
    );

    if (!row) return { status: "pending" };

    const { buyerAccountCreated, ...org } = row;

    return {
      status: "provisioned",
      ...org,
      orgUrl: `${env.get("SITE_URL")}/o/${row.orgSlug}/admin`,
      nextStep: buyerAccountCreated ? "set_password" : "sign_in",
    };
  }
}
