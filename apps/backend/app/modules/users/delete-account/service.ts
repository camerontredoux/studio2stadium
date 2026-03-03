import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import stripe from "#payments/stripe/main";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { DeleteAccountEvent } from "./event.ts";
import { Validator } from "./validator.ts";

interface UserInfo {
  id: string;
  displayEmail: string;
  firstName: string;
  role: string;
}

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(user: UserInfo, data?: Validator) {
    const subscription = await this.db.use((db) =>
      db.query.subscriptions.findFirst({
        where: {
          userId: user.id,
        },
      })
    );

    // Cancel in Stripe first — if this fails, we abort entirely
    if (subscription && subscription.status === "active") {
      try {
        await stripe.api.subscriptions.cancel(subscription.subscriptionId);
      } catch (err) {
        if (err instanceof Error) {
          throw new Error(err.message);
        }
        throw new Error(
          "Failed to cancel subscription. Account deletion aborted."
        );
      }
    }

    // Only reach here if Stripe succeeded or there was no subscription
    try {
      await this.db.use((db) => db.delete(users).where(eq(users.id, user.id)));
    } catch (err) {
      // Stripe subscription was canceled but user deletion failed
      // This is the dangerous case — log it loudly for manual intervention
      console.error(
        "CRITICAL: Stripe subscription canceled but user deletion failed",
        {
          userId: user.id,
          subscriptionId: subscription?.subscriptionId,
        }
      );
      throw new Error("Failed to delete account. Please contact support.");
    }

    // Dispatch event after successful deletion
    DeleteAccountEvent.dispatch({
      userId: user.id,
      userEmail: user.displayEmail,
      userName: user.firstName,
      feedback: data?.feedback,
    });
  }
}
