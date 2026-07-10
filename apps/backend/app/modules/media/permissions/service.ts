import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { GetSubscriptionService } from "#modules/subscriptions/get-status/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";

export const FREE_TIER_IMAGE_LIMIT = 4;
export const ORG_STANDARD_YOUTUBE_LIMIT = 3;

export interface MediaPermissions {
  canUploadDirectVideo: boolean;
  canAddYoutubeVideo: boolean;
  canUploadPhoto: boolean;
  youtubeLimit: number | null;
  photoLimit: number | null;
}

@inject()
export class GetMediaPermissionsService {
  constructor(
    private db: DatabaseService,
    private subscriptions: GetSubscriptionService
  ) {}

  async execute(userId: string): Promise<MediaPermissions> {
    const [user, subscription] = await Promise.all([
      this.db.use((db) =>
        db
          .select({
            role: users.role,
            type: users.type,
            orgAccountTier: users.orgAccountTier,
            orgAccountTierExpiresAt: users.orgAccountTierExpiresAt,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)
          .then((rows) => rows[0])
      ),
      this.subscriptions.execute(userId),
    ]);

    if (!user) {
      return {
        canUploadDirectVideo: false,
        canAddYoutubeVideo: false,
        canUploadPhoto: false,
        youtubeLimit: 0,
        photoLimit: 0,
      };
    }

    const isPremium = user.role === "admin" || subscription.subscribed;

    if (user.type === "school") {
      return {
        // Preserve existing school behavior: direct uploads and photos are not
        // dancer-tier gated, while YouTube links require premium/admin access.
        canUploadDirectVideo: true,
        canAddYoutubeVideo: isPremium,
        canUploadPhoto: true,
        youtubeLimit: null,
        photoLimit: null,
      };
    }

    if (isPremium) {
      return {
        canUploadDirectVideo: true,
        canAddYoutubeVideo: true,
        canUploadPhoto: true,
        youtubeLimit: null,
        photoLimit: null,
      };
    }

    const orgTierExpired =
      user.orgAccountTierExpiresAt !== null &&
      user.orgAccountTierExpiresAt < new Date();
    const orgTier = orgTierExpired ? null : user.orgAccountTier;

    if (orgTier === "standard") {
      return {
        canUploadDirectVideo: false,
        canAddYoutubeVideo: true,
        canUploadPhoto: true,
        youtubeLimit: ORG_STANDARD_YOUTUBE_LIMIT,
        photoLimit: FREE_TIER_IMAGE_LIMIT,
      };
    }

    if (orgTier === "limited") {
      return {
        canUploadDirectVideo: false,
        canAddYoutubeVideo: false,
        canUploadPhoto: false,
        youtubeLimit: 0,
        photoLimit: 0,
      };
    }

    return {
      canUploadDirectVideo: false,
      canAddYoutubeVideo: false,
      canUploadPhoto: true,
      youtubeLimit: 0,
      photoLimit: FREE_TIER_IMAGE_LIMIT,
    };
  }
}
