import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(username: string) {
    const dancer = await this.getDancer(username);

    if (!dancer) return null;

    const { dancerProfile, ...user } = dancer;

    const { subscription, images, avatar, ...rest } = user;

    if (!dancerProfile) return null;

    const profileImages = images.map((image) => ({
      ...image,
      mediaUrl: image.mediaUrl.startsWith("feed")
        ? imageUrl(image.mediaUrl, { fit: "scale-down", width: 1080 })
        : image.mediaUrl,
    }));

    const profilePicture = user.avatar?.startsWith("avatar")
      ? imageUrl(user.avatar, { fit: "cover", width: 320, height: 320 })
      : user.avatar;

    return {
      ...rest,
      ...dancerProfile,
      avatar: profilePicture,
      images: profileImages,
      subscribed: !!subscription,
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
          displayEmail: true,
          username: true,
          avatar: true,
          phone: true,
          firstName: true,
          lastName: true,
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
