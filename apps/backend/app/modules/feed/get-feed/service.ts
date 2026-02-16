import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

type FeedItem = Awaited<ReturnType<Service["getFeed"]>>[number];
type ContentType = FeedItem["contentType"];

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(type: "dancer" | "school", userId: string) {
    const following = await this.getFollowing(type, userId);

    const feed = await this.getFeed(following);

    const groupedByType = this.groupByContentType(feed);

    const contentMap = await this.fetchAllContent(groupedByType);

    return feed.flatMap((item) => {
      if (!item.user) return [];

      return [
        {
          ...item,
          user: item.user,
          content: contentMap.get(`${item.contentType}:${item.contentId}`),
        },
      ];
    });
  }

  async getFeed(following: string[]) {
    const feed = await this.db.use((db) =>
      db.query.feed.findMany({
        where: {
          userId: {
            in: following,
          },
          user: true,
        },
        with: {
          user: {
            columns: {
              username: true,
              avatar: true,
              firstName: true,
              lastName: true,
            },
            with: {
              schoolProfile: {
                columns: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    );

    return feed;
  }

  async fetchAllContent(groupedByType: Map<ContentType, string[]>) {
    const contentMap = new Map<string, unknown>();

    const fetchPromises: Promise<void>[] = [];

    for (const [type, ids] of groupedByType) {
      fetchPromises.push(
        this.fetchContentByType(type, ids).then((items) => {
          for (const item of items) {
            contentMap.set(`${type}:${item.id}`, item);
          }
        })
      );
    }

    await Promise.all(fetchPromises);
    return contentMap;
  }

  groupByContentType(feed: FeedItem[]) {
    const grouped = new Map<ContentType, string[]>();

    for (const item of feed) {
      const ids = grouped.get(item.contentType) ?? [];
      ids.push(item.contentId);
      grouped.set(item.contentType, ids);
    }

    return grouped;
  }

  async getFollowing(type: "dancer" | "school", userId: string) {
    if (type === "dancer") {
      const profile = await this.db.use((db) =>
        db.query.dancerProfiles.findFirst({
          where: {
            userId,
          },
          columns: {},
          with: {
            following: {
              columns: {
                userId: true,
              },
            },
          },
        })
      );
      return profile?.following.map((profile) => profile.userId) ?? [];
    }

    const profile = await this.db.use((db) =>
      db.query.schoolProfiles.findFirst({
        where: {
          userId,
        },
        columns: {},
        with: {
          favorites: {
            columns: {
              userId: true,
            },
          },
        },
      })
    );
    return profile?.favorites.map((profile) => profile.userId) ?? [];
  }

  private async fetchContentByType(type: ContentType, ids: string[]) {
    return this.db.use(async (db) => {
      switch (type) {
        case "image":
          return db.query.images.findMany({
            where: { id: { in: ids } },
          });

        case "video":
          return db.query.videos.findMany({
            where: { id: { in: ids } },
          });

        case "achievement":
          return db.query.achievements.findMany({
            where: { id: { in: ids } },
          });

        case "reference":
          return db.query.references.findMany({
            where: { id: { in: ids } },
          });

        case "profile":
          return db.query.schoolProfiles.findMany({
            where: { id: { in: ids } },
          });

        default:
          console.warn(`Unknown content type: ${type}`);
          return [];
      }
    });
  }
}
