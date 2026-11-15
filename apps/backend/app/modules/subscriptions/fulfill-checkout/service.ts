import { subscriptions, weekPasses } from "#database/schema/subscriptions";
import { DatabaseService } from "#database/service";
import { SubscriptionCreatedEvent } from "#modules/webhooks/stripe/event";
import stripe from "#payments/stripe/main";
import { WEEK_PASS_DAYS } from "#shared/plans";
import { inject } from "@adonisjs/core";
import { eq, max, ne, sql } from "drizzle-orm";
import { type Stripe } from "stripe";

const DAY_MS = 86_400_000;

/** Set on a Week Pass Checkout Session, so the webhook can tell it from an Event Tier purchase. */
export const WEEK_PASS_PURCHASE = "week_pass";

/**
 * The fields of a completed Checkout Session that fulfilment reads.
 */
export type CompletedSession = Pick<
  Stripe.Checkout.Session,
  | "id"
  | "client_reference_id"
  | "subscription"
  | "metadata"
  | "payment_status"
  | "payment_intent"
>;

export function isWeekPassSession(session: Pick<CompletedSession, "metadata">) {
  return session.metadata?.purchase === WEEK_PASS_PURCHASE;
}

/**
 * Turn a completed Dancer checkout into access: a subscription row for
 * Monthly, Season Pass and Annual, or a Week Pass. Both the Stripe webhook
 * and the Dancer's return from checkout call this, in either order and
 * possibly at once, so each path records a purchase once.
 */
@inject()
export class FulfillCheckoutService {
  constructor(private db: DatabaseService) {}

  async execute(session: CompletedSession) {
    const userId = session.client_reference_id;
    if (!userId) return;

    if (isWeekPassSession(session)) {
      return await this.weekPass(userId, session);
    }

    if (session.subscription) {
      return await this.subscription(
        userId,
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id
      );
    }
  }

  /**
   * A pass bought while another is running starts when the running one ends,
   * so a repeat purchase adds seven days. The user's lock serializes
   * purchases, so two at once cannot both start from the same end.
   */
  private async weekPass(userId: string, session: CompletedSession) {
    // Card-only sessions complete paid; anything else has not been paid for.
    if (session.payment_status !== "paid") return;

    await this.db.tx(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);

      const [recorded] = await tx
        .select({ id: weekPasses.id })
        .from(weekPasses)
        .where(eq(weekPasses.checkoutSessionId, session.id));
      if (recorded) return;

      const [latest] = await tx
        .select({ endsAt: max(weekPasses.endsAt) })
        .from(weekPasses)
        .where(eq(weekPasses.userId, userId));

      const now = new Date();
      const startsAt =
        latest?.endsAt && latest.endsAt > now ? latest.endsAt : now;

      await tx.insert(weekPasses).values({
        userId,
        checkoutSessionId: session.id,
        paymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null),
        startsAt,
        endsAt: new Date(startsAt.getTime() + WEEK_PASS_DAYS * DAY_MS),
      });
    });
  }

  private async subscription(userId: string, subscriptionId: string) {
    const subscription =
      await stripe.api.subscriptions.retrieve(subscriptionId);

    const item = subscription.items.data[0];

    const priceId = item.price.id;
    const currentPeriodEnd = new Date(item.current_period_end * 1000);
    // Every checkout creates a new Stripe subscription, so this is a fresh
    // start of Premium (first time, or a return after a lapse).
    const startedAt = new Date(subscription.start_date * 1000);

    const values = {
      status: subscription.status,
      subscriptionId: subscription.id,
      customerId: subscription.customer as string,
      priceId,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd,
      startedAt,
    };

    // A row already holding this subscription was fulfilled by the other
    // path, so the update is skipped and nothing is returned: the welcome
    // email goes out once.
    const [user] = await this.db.use((db) =>
      db
        .insert(subscriptions)
        .values({ userId, source: "stripe", ...values })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: { ...values, canceledAt: null },
          setWhere: ne(subscriptions.subscriptionId, subscription.id),
        })
        .returning({ id: subscriptions.userId })
    );

    if (user) {
      SubscriptionCreatedEvent.dispatch({ userId: user.id });
    }
  }
}
