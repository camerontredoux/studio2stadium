import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { videoThumbnailUrl, videoUrl } from "#utils/video-url";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(username: string) {
    const school = await this.getSchool(username);

    if (!school) return null;

    const { schoolProfile, images, videos, avatar, ...user } = school;

    if (!schoolProfile) return null;

    const { schoolSkills, ...profile } = schoolProfile;
    const skills = schoolSkills.flatMap((ss) => {
      if (!ss.skill) return [];
      return [{ name: ss.skill.name, slug: ss.skill.slug, category: ss.skill.category, weight: ss.weight ?? 1 }];
    });

    const profileImages = images.map((image) => ({
      ...image,
      mediaUrl: imageUrl(image.mediaUrl, "feed"),
      thumbnail: imageUrl(image.mediaUrl, "thumbnail"),
    }));

    const profilePicture = imageUrl(avatar, "avatar");

    const profileVideos = videos.map((video) => ({
      ...video,
      mediaUrl: videoUrl(video.mediaId, video.type),
      thumbnail: videoThumbnailUrl(video.mediaId, video.type),
    }));

    return {
      ...user,
      images: profileImages,
      avatar: profilePicture,
      videos: profileVideos,
      ...profile,
      skills,
    };
  }

  async getSchool(username: string) {
    return await this.db.use((db) =>
      db.query.users.findFirst({
        where: {
          username,
        },
        columns: {
          username: true,
          avatar: true,
          displayEmail: true,
        },
        with: {
          globalEvents: {
            orderBy: {
              startDatetime: "asc",
            },
            where: {
              startDatetime: {
                gte: new Date(),
              },
            },
          },
          images: true,
          videos: true,
          schoolProfile: {
            with: {
              schoolSkills: {
                with: { skill: true },
              },
              styles: true,
              events: {
                orderBy: {
                  startDatetime: "asc",
                },
                where: {
                  startDatetime: {
                    gte: new Date(),
                  },
                },
              },
              sports: true,
            },
          },
        },
      })
    );
  }
}
