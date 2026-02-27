import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(username: string) {
    const school = await this.getSchool(username);

    if (!school) return null;

    const { schoolProfile, events, images, ...user } = school;

    if (!schoolProfile) return null;

    const profileImages = images.map((image) => ({
      ...image,
      mediaUrl: image.mediaUrl.startsWith("feed")
        ? imageUrl(image.mediaUrl, { fit: "scale-down", width: 1080 })
        : image.mediaUrl,
    }));

    return {
      ...user,
      images: profileImages,
      attendingEvents: events,
      ...schoolProfile,
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
          images: true,
          videos: true,
          schoolProfile: {
            with: {
              skills: true,
              styles: true,
              events: true,
              sports: true,
            },
          },
        },
      })
    );
  }
}
