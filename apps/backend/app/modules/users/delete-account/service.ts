import { videoUploads, videos } from "#database/schema/media";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import stripe from "#payments/stripe/main";
import { deleteStreamVideo } from "#shared/cloudflare/stream";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
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

    // Read the Stream uids before the cascade removes the rows that hold them
    const streamMediaIds = await this.streamMediaIds(user.id);

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

    // Remove the user's videos from Cloudflare Stream. The account is already
    // gone, so a Cloudflare failure is logged rather than thrown.
    const results = await Promise.allSettled(
      streamMediaIds.map((mediaId) => deleteStreamVideo(mediaId))
    );
    results.forEach((result, i) => {
      if (result.status === "rejected") {
        console.error(
          `Failed to delete Stream video ${streamMediaIds[i]} for deleted user ${user.id}:`,
          result.reason
        );
      }
    });

    // Dispatch event after successful deletion
    DeleteAccountEvent.dispatch({
      userId: user.id,
      userEmail: user.displayEmail,
      userName: user.firstName,
      feedback: data?.feedback,
    });
  }

  private async streamMediaIds(userId: string) {
    const [uploads, profileVideos] = await this.db.use((db) =>
      Promise.all([
        db
          .select({ mediaId: videoUploads.cloudflareMediaId })
          .from(videoUploads)
          .where(eq(videoUploads.userId, userId)),
        db
          .select({ mediaId: videos.mediaId })
          .from(videos)
          .where(and(eq(videos.userId, userId), eq(videos.type, "cloudflare"))),
      ])
    );

    return [
      ...new Set([...uploads, ...profileVideos].map((row) => row.mediaId)),
    ];
  }
}
