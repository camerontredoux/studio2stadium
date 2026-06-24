import { DatabaseService } from "#database/service";
import { GetSubscriptionService } from "#modules/subscriptions/get-status/service";
import { imageUrl } from "#utils/image-url";
import { videoThumbnailUrl, videoUrl } from "#utils/video-url";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(
    private db: DatabaseService,
    private subscriptions: GetSubscriptionService,
  ) {}

  async execute(username: string) {
    const dancer = await this.getDancer(username);

    if (!dancer) return null;

    const { dancerProfile, ...user } = dancer;

    const { subscription, images, avatar, videos, id, limited, ...rest } = user;

    if (!dancerProfile) return null;

    const profileImages = images.map((image) => ({
      ...image,
      mediaUrl: imageUrl(image.mediaUrl, "feed"),
      thumbnail: imageUrl(image.mediaUrl, "thumbnail"),
    }));

    const profilePicture = imageUrl(user.avatar, "avatar");

    const profileVideos = videos.map((video) => ({
      ...video,
      mediaUrl: videoUrl(video.mediaId, video.type),
      thumbnail: videoThumbnailUrl(video.mediaId, video.type),
    }));

    // Source of truth for access tier: stripe (real sub) > org_event (grant) >
    // none. This fixes a prior bug where grant users read subscribed:false
    // (the relation above only sees Stripe). `limited` drives the stripped-down
    // free-tier profile, and only applies when there is no active access.
    const status = await this.subscriptions.execute(id);

    return {
      ...rest,
      ...dancerProfile,
      avatar: profilePicture,
      images: profileImages,
      videos: profileVideos,
      subscribed: status.source !== "none",
      subscriptionSource: status.source,
      limited: limited && status.source === "none",
    };
  }

  async getDancer(username: string) {
    return await this.db.use((db) =>
      db.query.users.findFirst({
        where: {
          username,
          platforms: {
            platformName: "core",
          },
        },
        columns: {
          id: true,
          displayEmail: true,
          username: true,
          avatar: true,
          phone: true,
          firstName: true,
          lastName: true,
          limited: true,
        },
        with: {
          images: true,
          videos: true,
          events: {
            orderBy: {
              startDatetime: "asc",
            },
            where: {
              startDatetime: {
                gte: new Date(),
              },
            },
            columns: {
              id: true,
              title: true,
              startDatetime: true,
              endDatetime: true,
              location: true,
              type: true,
            },
            with: {
              organizer: {
                columns: {
                  name: true,
                },
              },
            },
          },
          globalEvents: {
            orderBy: {
              startDatetime: "asc",
            },
            where: {
              startDatetime: {
                gte: new Date(),
              },
            },
            columns: {
              id: true,
              title: true,
              startDatetime: true,
              endDatetime: true,
              location: true,
              type: true,
            },
          },
          subscription: {
            where: {
              status: "active",
            },
          },
          dancerProfile: {
            columns: {
              id: true,
              biography: true,
              birthday: true,
              location: true,
              teamLevel: true,
              highSchool: true,
              studio: true,
              gpa: true,
              gradYear: true,
              trainingHours: true,
              tiktok: true,
              instagram: true,
              youtube: true,
            },
            with: {
              skills: true,
              styles: true,
              sports: true,
              references: true,
              achievements: true,
              submission: true,
            },
          },
        },
      })
    );
  }
}
