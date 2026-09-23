import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import { orgEvents } from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { DatabaseService } from "#database/service";
import { hasPendingPasswordToken } from "#modules/auth/password-tokens";
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
       * account, or their account still has an unspent set-password link from
       * an earlier purchase — the page says to check their email for the
       * set-password link. `claim` when the purchase landed on an existing
       * account whose owner has not proved they read its inbox and the Org is
       * awaiting its claim — the page says to check their email to claim it
       * (ADR 0007). `sign_in` when they already had a password and the Org is
       * theirs.
       */
      nextStep: "set_password" | "claim" | "sign_in";
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
          buyerId: eventTierPurchases.buyerId,
          buyerAccountCreated: eventTierPurchases.buyerAccountCreated,
          claimRequired: eventTierPurchases.claimRequired,
          claimedAt: eventTierPurchases.claimedAt,
        })
        .from(eventTierPurchases)
        .innerJoin(orgEvents, eq(orgEvents.id, eventTierPurchases.eventId))
        .innerJoin(organizations, eq(organizations.id, orgEvents.orgId))
        .where(eq(eventTierPurchases.reference, params.sessionId))
        .limit(1)
    );

    if (!row) return { status: "pending" };

    const { buyerId, buyerAccountCreated, claimRequired, claimedAt, ...org } =
      row;

    return {
      status: "provisioned",
      ...org,
      orgUrl: `${env.get("SITE_URL")}/o/${row.orgSlug}/admin`,
      nextStep: await nextStep(),
    };

    // The same rules the Org-ready email follows, so the page and the email
    // agree on which link is on its way. A claimed Org is the buyer's, and
    // they sign in to reach it.
    async function nextStep(): Promise<"set_password" | "claim" | "sign_in"> {
      if (claimRequired) return claimedAt ? "sign_in" : "claim";
      const setsPassword =
        buyerAccountCreated ||
        (await hasPendingPasswordToken("setup", buyerId));
      return setsPassword ? "set_password" : "sign_in";
    }
  }
}
