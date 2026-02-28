import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(username: string) {
    const school = await this.getSchool(username);

    if (!school) return null;

    const { schoolProfile, events, images, avatar, ...user } = school;

    if (!schoolProfile) return null;

    const profileImages = images.map((image) => ({
      ...image,
      mediaUrl: imageUrl(image.mediaUrl, { fit: "scale-down", width: 1080 }),
      thumbnail: imageUrl(image.mediaUrl, {
        fit: "cover",
        width: 320,
        height: 320,
      }),
    }));

    const profilePicture = imageUrl(avatar, {
      fit: "cover",
      width: 320,
      height: 320,
    });

    return {
      ...user,
      images: profileImages,
      avatar: profilePicture,
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
