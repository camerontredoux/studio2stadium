import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import { orgEvents } from "#database/schema/org-events";
import { orgMemberships, organizations } from "#database/schema/organizations";
import { platforms, users } from "#database/schema/users";
import { DatabaseService, type Transaction } from "#database/service";
import { E_DATABASE_ERROR } from "#exceptions/database";
import {
  hasPendingPasswordToken,
  mintPasswordToken,
} from "#modules/auth/password-tokens";
import env from "#start/env";
import { normalizeEmail } from "#utils/normalize-email";
import { emailClaimLink } from "../claim/notify.ts";
import { inject } from "@adonisjs/core";
import hash from "@adonisjs/core/services/hash";
import logger from "@adonisjs/core/services/logger";
import * as Sentry from "@sentry/node";
import { and, asc, eq, inArray } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { type PurchaseDetails } from "../checkout/metadata.ts";
import { sendOrgReadyEmail } from "./event.ts";
import { orgSlugCandidates } from "./slug.ts";

/**
 * A purchase that has been paid for, as the completed Checkout Session
 * describes it. No Stripe types here on purpose: the webhook (issue #90) owns
 * reading the session, and provisioning owns what a purchase turns into, so the
 * part worth testing can be tested without faking a payment provider.
 */
export interface ProvisionInput {
  /**
   * The purchase's identity at the payment provider — the completed Checkout
   * Session id. Provisioning is idempotent on this and nothing else, because a
   * redelivered webhook is the same purchase and a second purchase of the same
   * event by the same buyer is not.
   */
  reference: string;
  /**
   * The buyer, as they named themselves in the pre-checkout form. The email is
   * the one they typed there and never Stripe's billing email: a corporate
   * card carries the finance department's address, and matching on it
   * provisions Orgs the buyer cannot log into (ADR 0007, PRD story 17).
   */
  buyer: PurchaseBuyer;
  /** What was bought, as the buyer described it before paying. */
  purchase: PurchaseDetails;
  /**
   * The payment that settled the purchase — the session's PaymentIntent.
   * Recorded so a later refund or dispute, which names the payment rather than
   * the session, can find the purchase it undoes (ADR 0005). Absent in callers
   * that provision without a payment, such as tests of provisioning itself.
   */
  paymentIntentId?: string | null;
  /**
   * What the buyer was charged, in the currency's minor unit, so staff can
   * answer a billing question from the admin dashboard (#92). Absent in callers
   * that provision without a payment.
   */
  amountTotal?: number | null;
  currency?: string | null;
}

export interface PurchaseBuyer {
  name: string;
  email: string;
}

/** The account a purchase landed on. */
export interface ProvisionedBuyer {
  id: string;
  firstName: string;
  /** The account's own address, which is where its emails go. */
  email: string;
  /**
   * Whether this purchase created the account. Such an account has no
   * password anyone knows, and its owner is emailed a link to set one.
   */
  accountCreated: boolean;
  /**
   * Whether the purchase landed on an existing account nobody has proved they
   * own the inbox of (ADR 0007). Signup does not check that, so the account
   * may belong to someone other than the buyer. The Org is provisioned
   * without the buyer's admin membership, and the owner of the address is
   * emailed a link to claim it.
   */
  claimRequired: boolean;
}

export interface ProvisionResult {
  purchase: typeof eventTierPurchases.$inferSelect;
  org: typeof organizations.$inferSelect;
  event: typeof orgEvents.$inferSelect;
  buyer: ProvisionedBuyer;
  /**
   * False when this reference had already been provisioned, in which case
   * nothing was written and the rows returned are the ones the first delivery
   * created.
   */
  provisioned: boolean;
}

const isUniqueViolation = (error: unknown) =>
  error instanceof E_DATABASE_ERROR && error.code === "E_UNIQUE_VIOLATION";

@inject()
export class ProvisionPurchaseService {
  constructor(private db: DatabaseService) {}

  /**
   * Turn a completed purchase into a working customer: the buyer's account
   * (found by the email they typed, or created for it), an Org, its Org Event
   * at the Event Tier that was bought, the buyer's organizer admin membership,
   * and the record of the sale.
   *
   * All of it or none of it. A half-provisioned customer — an Org with no event,
   * or an event nobody can administer — is worse than a failed purchase, so this
   * is one transaction and a failure part-way leaves nothing behind, the new
   * account included.
   *
   * The buyer is told their Org is ready only after that commits, and only by
   * the delivery that provisioned it: a redelivered webhook finds the purchase
   * recorded and sends nothing.
   */
  async execute(input: ProvisionInput): Promise<ProvisionResult> {
    const email = await normalizeEmail(input.buyer.email);

    let result: ProvisionResult;
    try {
      result = await this.provision(input, email);
    } catch (error) {
      // Two provisions racing — a redelivered webhook arriving while the first
      // is still open, two purchases creating an account for the same new
      // email, or another Org claiming the slug we picked between our read and
      // our insert. All are lost races rather than bad input, and the whole
      // attempt has already rolled back, so the retry starts clean: it finds
      // the purchase already recorded, finds the account the other purchase
      // created, or draws another slug.
      if (!isUniqueViolation(error)) throw error;

      result = await this.provision(input, email);
    }

    if (result.provisioned) await this.welcomeBuyer(result);

    return result;
  }

  /** The recorded sale for a purchase reference, if it has been provisioned. */
  async find(reference: string) {
    return await this.db.use(async (db) => {
      const [row] = await db
        .select()
        .from(eventTierPurchases)
        .where(eq(eventTierPurchases.reference, reference))
        .limit(1);

      return row ?? null;
    });
  }

  private async provision(
    input: ProvisionInput,
    email: string
  ): Promise<ProvisionResult> {
    return await this.db.tx(async (tx) => {
      const already = await this.findProvisioned(tx, input.reference);
      if (already) return already;

      const buyer = await this.resolveBuyer(tx, input.buyer, email);

      // An account awaiting a claim may be run by whoever registered the
      // address, and so may any Org it administers: the purchase gets an Org
      // of its own rather than joining one of those.
      const org = await this.markSelfServe(
        tx,
        buyer.claimRequired
          ? await this.createOrg(tx, input.purchase.orgName)
          : await this.resolveOrg(tx, buyer.id, input.purchase.orgName)
      );

      const event = await this.createEvent(tx, org.id, input.purchase);

      // The buyer administers the Org they bought for. `organizer`, never
      // `coach`: an Organizer runs the event rather than recruiting at it (ADR
      // 0003). A buyer whose second purchase lands on an Org they already
      // administer keeps the membership they have. An account awaiting a claim
      // gets the membership only when the owner of its inbox claims the Org
      // (`claim/complete.ts`).
      if (!buyer.claimRequired) {
        await tx
          .insert(orgMemberships)
          .values({
            orgId: org.id,
            userId: buyer.id,
            role: "admin",
            type: "organizer",
          })
          .onConflictDoNothing();
      }

      const [purchase] = await tx
        .insert(eventTierPurchases)
        .values({
          reference: input.reference,
          buyerId: buyer.id,
          eventId: event.id,
          eventTier: input.purchase.eventTier,
          paymentIntentId: input.paymentIntentId ?? null,
          amountTotal: input.amountTotal ?? null,
          currency: input.currency ?? null,
          buyerAccountCreated: buyer.accountCreated,
          claimRequired: buyer.claimRequired,
        })
        .returning();

      return { purchase: purchase!, org, event, buyer, provisioned: true };
    });
  }

  private async findProvisioned(
    tx: Transaction,
    reference: string
  ): Promise<ProvisionResult | null> {
    const [row] = await tx
      .select({
        purchase: eventTierPurchases,
        org: organizations,
        event: orgEvents,
        buyer: {
          id: users.id,
          firstName: users.firstName,
          email: users.displayEmail,
        },
      })
      .from(eventTierPurchases)
      .innerJoin(orgEvents, eq(orgEvents.id, eventTierPurchases.eventId))
      .innerJoin(organizations, eq(organizations.id, orgEvents.orgId))
      .innerJoin(users, eq(users.id, eventTierPurchases.buyerId))
      .where(eq(eventTierPurchases.reference, reference))
      .limit(1);

    if (!row) return null;

    return {
      ...row,
      buyer: {
        ...row.buyer,
        accountCreated: row.purchase.buyerAccountCreated,
        claimRequired: row.purchase.claimRequired,
      },
      provisioned: false,
    };
  }

  /**
   * The account this purchase belongs to: the one already registered to the
   * buyer's email, or a new one created for it.
   *
   * An existing account gets the Org straight away only when someone has
   * proved they read its inbox: `users.emailVerifiedAt` is set (they used a
   * password or claim link), or an earlier purchase created the account, whose
   * password can only have been set through a link sent to that inbox. Signup
   * does not check that the person owns the address, and `users.verified` is
   * no proof either — a dancer sets it by finishing onboarding. Any other
   * account needs a claim (ADR 0007).
   *
   * A new account is a core-platform user of the `organizer` account type:
   * it exists to administer the Org it bought, has no dancer or school
   * profile, and the product sends it to that Org rather than through dancer
   * onboarding. Being an Organizer inside the Org is still the membership
   * type (ADR 0003). It is named as the buyer named themselves, with no
   * profile and no password anyone knows. Its hash
   * is of a random secret that is thrown away, so nothing can sign in until
   * the owner sets a password through the link `welcomeBuyer` emails.
   *
   * Looked up by the normalized email, the way signup stores it, so a buyer
   * who already signed up under an alias of the same mailbox is found rather
   * than given a second account. Two purchases creating the same account at
   * once meet on the unique email: the loser rolls back and its retry finds
   * the winner's account.
   */
  private async resolveBuyer(
    tx: Transaction,
    buyer: PurchaseBuyer,
    email: string
  ): Promise<ProvisionedBuyer> {
    const [existing] = await tx
      .select({
        id: users.id,
        firstName: users.firstName,
        email: users.displayEmail,
        emailVerifiedAt: users.emailVerifiedAt,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      const { emailVerifiedAt, ...account } = existing;
      const ownsInbox =
        emailVerifiedAt !== null ||
        (await this.createdByPurchase(tx, account.id));

      return { ...account, accountCreated: false, claimRequired: !ownsInbox };
    }

    const { firstName, lastName } = splitName(buyer.name);

    const [created] = await tx
      .insert(users)
      .values({
        email,
        displayEmail: buyer.email,
        password: await hash.make(randomBytes(32).toString("hex")),
        firstName,
        lastName,
        username: organizerUsername(buyer.name),
        role: "user",
        type: "organizer",
      })
      .returning({
        id: users.id,
        firstName: users.firstName,
        email: users.displayEmail,
      });

    await tx.insert(platforms).values({
      platformName: "core",
      userId: created!.id,
    });

    return { ...created!, accountCreated: true, claimRequired: false };
  }

  /** Whether an earlier purchase created this account. */
  private async createdByPurchase(tx: Transaction, userId: string) {
    const [row] = await tx
      .select({ id: eventTierPurchases.id })
      .from(eventTierPurchases)
      .where(
        and(
          eq(eventTierPurchases.buyerId, userId),
          eq(eventTierPurchases.buyerAccountCreated, true)
        )
      )
      .limit(1);

    return row !== undefined;
  }

  /**
   * Tell the buyer their Org is ready and how to get in: a single-use link to
   * set their password when their account has none they know, a single-use
   * link to claim the Org when the account needs a claim, or a nudge to sign
   * in when they already had one.
   *
   * An account has no password its owner knows when this purchase created it,
   * or when an earlier purchase created it and its set-password link is still
   * unspent — a second purchase before the buyer opened the first email, or
   * the losing side of two purchases creating the same account at once. Such
   * a buyer gets a fresh link too, which replaces the earlier one: telling
   * them to sign in would leave them with no password to sign in with.
   *
   * After the commit, so nobody is emailed about an Org that rolled back, and
   * never fatal: the purchase is provisioned, and failing the webhook now would
   * only make Stripe redeliver an event that finds nothing left to do. Each
   * send and each failure is logged by `sendOrgReadyEmail`. A buyer whose
   * email was lost can still get in through "Forgot password".
   */
  private async welcomeBuyer(result: ProvisionResult) {
    const { buyer, org, event } = result;

    try {
      if (buyer.claimRequired) {
        await emailClaimLink({ buyer, org, event });
        return;
      }

      const needsPassword =
        buyer.accountCreated ||
        (await hasPendingPasswordToken("setup", buyer.id));

      const setPasswordUrl = needsPassword
        ? `${env.get("SITE_URL")}/reset?token=${await mintPasswordToken("setup", buyer.id)}&userId=${buyer.id}`
        : null;

      await sendOrgReadyEmail(
        {
          to: buyer.email,
          firstName: buyer.firstName,
          orgName: org.name,
          orgUrl: `${env.get("SITE_URL")}/o/${org.slug}/admin`,
          eventName: event.name,
          setPasswordUrl,
        },
        { orgSlug: org.slug }
      );
    } catch (error) {
      // The send itself never throws — `sendOrgReadyEmail` logs and reports a
      // failed email. This is minting the link failing before anything went.
      logger.error(
        { err: error, purchaseId: result.purchase.id, buyerId: buyer.id },
        "Failed to prepare the email to the buyer of a provisioned Event Tier purchase"
      );
      Sentry.captureException(error, {
        extra: { purchaseId: result.purchase.id, buyerId: buyer.id },
      });
    }
  }

  /**
   * The Org this purchase belongs to.
   *
   * S2S Live is sold per event, not per Org (ADR 0001), so a buyer who already
   * administers an Org is buying another event for it — the Org name they typed
   * is the name of an Org they already have, and creating a second one would
   * split their events across two tenants. The Org they administer wins over the
   * name they typed, and the first one they were given wins if they administer
   * several.
   */
  private async resolveOrg(tx: Transaction, buyerId: string, orgName: string) {
    const [existing] = await tx
      .select({ org: organizations })
      .from(orgMemberships)
      .innerJoin(organizations, eq(organizations.id, orgMemberships.orgId))
      .where(
        and(
          eq(orgMemberships.userId, buyerId),
          eq(orgMemberships.type, "organizer"),
          eq(orgMemberships.role, "admin")
        )
      )
      .orderBy(asc(orgMemberships.createdAt))
      .limit(1);

    if (existing) return existing.org;

    return await this.createOrg(tx, orgName);
  }

  /** A new Org with this name, at the best free slug for it. */
  private async createOrg(tx: Transaction, orgName: string) {
    const [org] = await tx
      .insert(organizations)
      .values({ name: orgName, slug: await this.freeSlug(tx, orgName) })
      .returning();

    return org!;
  }

  /**
   * Record that this Org now holds a purchase. From here on its Organizers buy
   * further events rather than create them (#112), and the flag lives on the
   * Org, not in the purchase row, so deleting the bought event cannot undo it.
   * An Org already self-serve is returned as it is.
   */
  private async markSelfServe(
    tx: Transaction,
    org: typeof organizations.$inferSelect
  ) {
    if (org.selfServe) return org;

    const [updated] = await tx
      .update(organizations)
      .set({ selfServe: true })
      .where(eq(organizations.id, org.id))
      .returning();

    return updated!;
  }

  /** The best slug for this Org name that nothing else has taken. */
  private async freeSlug(tx: Transaction, orgName: string) {
    const candidates = orgSlugCandidates(orgName);

    const taken = await tx
      .select({ slug: organizations.slug })
      .from(organizations)
      .where(inArray(organizations.slug, candidates));

    const used = new Set(taken.map((row) => row.slug));
    const free = candidates.find((candidate) => !used.has(candidate));

    // Every numbered variant and the random one taken at once. Raised as a
    // unique violation deliberately: `execute` retries those once, and the
    // retry draws a new random candidate rather than the same losing set.
    if (!free) {
      throw new E_DATABASE_ERROR(`No slug available for "${orgName}"`, {
        code: "E_UNIQUE_VIOLATION",
        cause: "organizations_slug_unique",
      });
    }

    return free;
  }

  /**
   * The Org Event that was bought, stamped with the Event Tier it was bought at
   * — that is where entitlement lives (ADR 0002), so the sold name and the
   * enforced one are set together.
   *
   * It is created inactive, and provisioning never touches that flag. An Org's
   * active event is the one the whole product routes into — `OrgEventMiddleware`
   * resolves it for every request into the Org's area — and what arrives here is
   * a name and a pair of dates, with no venue, no roster, and no checklist done.
   * The Organizer configures the event and then activates it through
   * `orgs/events/update`, which is also the only place that knows to stand the
   * previous active event down.
   *
   * No Roster Entry is created for the buyer. `CreateEventService` seeds a staff
   * roster row for the admin who creates an event through the product, which is
   * a preview sandbox for someone who will be using the event's coach views. A
   * purchase is not that: the buyer is an Organizer, and an Organizer never
   * appears on a roster (ADR 0003).
   */
  private async createEvent(
    tx: Transaction,
    orgId: string,
    purchase: PurchaseDetails
  ) {
    const [event] = await tx
      .insert(orgEvents)
      .values({
        orgId,
        name: purchase.eventName,
        startDate: purchase.startDate,
        endDate: purchase.endDate,
        eventTier: purchase.eventTier,
      })
      .returning();

    return event!;
  }
}

/**
 * A person's name as one field, split the way the rest of the product stores
 * it. Everything after the first word is the last name, which may be empty for
 * a buyer who gave one name.
 */
export function splitName(name: string) {
  const [firstName = "", ...rest] = name.trim().split(/\s+/);

  return { firstName, lastName: rest.join(" ") };
}

/**
 * A username for an account a purchase creates. The buyer never chose one, so
 * it is their name, reduced to what signup allows (letters and digits, at most
 * 32), with a random suffix that keeps it unique and off signup's reserved
 * list.
 */
export function organizerUsername(name: string) {
  const base =
    name
      .normalize("NFKD")
      .replace(/[^A-Za-z0-9]/g, "")
      .toLowerCase()
      .slice(0, 20) || "organizer";

  return `${base}${randomBytes(4).toString("hex")}`;
}
