import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { GetSubscriptionService } from "#modules/subscriptions/get-status/service";
import { PASS_PHOTO_LIMIT, PASS_VIDEO_LIMIT } from "#shared/plans";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";

export const FREE_TIER_IMAGE_LIMIT = 4;
export const ORG_STANDARD_YOUTUBE_LIMIT = 3;
export const DIRECT_VIDEO_LIMIT = 3;

export interface MediaPermissions {
  canUploadDirectVideo: boolean;
  canAddYoutubeVideo: boolean;
  canUploadPhoto: boolean;
  directVideoLimit: number | null;
  youtubeLimit: number | null;
  photoLimit: number | null;
  /** Direct and YouTube videos together, when the plan caps their total. */
  videoLimit: number | null;
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
        directVideoLimit: 0,
        youtubeLimit: 0,
        photoLimit: 0,
        videoLimit: null,
      };
    }

    const isPremium =
      user.role === "admin" || subscription.access === "premium";

    if (user.type === "school") {
      return {
        // Schools are never tier-gated: there is no premium school account.
        canUploadDirectVideo: true,
        canAddYoutubeVideo: true,
        canUploadPhoto: true,
        directVideoLimit: null,
        youtubeLimit: null,
        photoLimit: null,
        videoLimit: null,
      };
    }

    if (isPremium) {
      return {
        canUploadDirectVideo: true,
        canAddYoutubeVideo: true,
        canUploadPhoto: true,
        directVideoLimit: DIRECT_VIDEO_LIMIT,
        youtubeLimit: null,
        photoLimit: null,
        videoLimit: null,
      };
    }

    if (subscription.access === "pass") {
      return {
        canUploadDirectVideo: true,
        canAddYoutubeVideo: true,
        canUploadPhoto: true,
        directVideoLimit: PASS_VIDEO_LIMIT,
        youtubeLimit: PASS_VIDEO_LIMIT,
        photoLimit: PASS_PHOTO_LIMIT,
        videoLimit: PASS_VIDEO_LIMIT,
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
        directVideoLimit: 0,
        youtubeLimit: ORG_STANDARD_YOUTUBE_LIMIT,
        photoLimit: FREE_TIER_IMAGE_LIMIT,
        videoLimit: null,
      };
    }

    if (orgTier === "limited") {
      return {
        canUploadDirectVideo: false,
        canAddYoutubeVideo: false,
        canUploadPhoto: false,
        directVideoLimit: 0,
        youtubeLimit: 0,
        photoLimit: 0,
        videoLimit: null,
      };
    }

    return {
      canUploadDirectVideo: false,
      canAddYoutubeVideo: false,
      canUploadPhoto: true,
      directVideoLimit: 0,
      youtubeLimit: 0,
      photoLimit: FREE_TIER_IMAGE_LIMIT,
      videoLimit: null,
    };
  }
}
