import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

type FeedItem = Awaited<ReturnType<Service["getFeed"]>>[number];
type ContentType = FeedItem["contentType"];
type ContentData = {
  id: string;
  caption: string | null;
  content: string | null;
};

const PAGE_SIZE = 10;

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(type: "dancer" | "school", userId: string, cursor?: string) {
    const following = await this.getFollowing(type, userId);
    const feed = await this.getFeed(following, cursor);
    const groupedByType = this.groupByContentType(feed);
    const contentMap = await this.fetchAllContent(groupedByType);
    const items = this.mapFeedItems(feed, contentMap, type);
    const nextCursor = this.calculateNextCursor(feed);

    return { feed: items, nextCursor };
  }

  mapFeedItems(
    feed: FeedItem[],
    contentMap: Map<string, ContentData>,
    type: "dancer" | "school"
  ) {
    return feed.flatMap((item) => {
      if (!item.user) return [];

      const name = this.getDisplayName(item.user, type);
      const content = contentMap.get(`${item.contentType}:${item.contentId}`);

      if (!content) return [];

      return [
        {
          ...content,
          contentType: item.contentType,
          createdAt: item.createdAt,
          username: item.user.username,
          avatar: item.user.avatar,
          name,
        },
      ];
    });
  }

  getDisplayName(
    user: NonNullable<FeedItem["user"]>,
    type: "dancer" | "school"
  ): string | undefined {
    return type === "dancer"
      ? user.schoolProfile?.name
      : user.firstName + " " + user.lastName;
  }

  calculateNextCursor(feed: FeedItem[]): string | undefined {
    return feed.length === PAGE_SIZE
      ? feed[feed.length - 1].createdAt.toISOString()
      : undefined;
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
    return type === "dancer"
      ? this.getDancerFollowing(userId)
      : this.getSchoolFavorites(userId);
  }

  async getDancerFollowing(userId: string) {
    const profile = await this.db.use((db) =>
      db.query.dancerProfiles.findFirst({
        where: { userId },
        columns: {},
        with: {
          following: {
            columns: { userId: true },
          },
        },
      })
    );
    return profile?.following.map((f) => f.userId) ?? [];
  }

  async getSchoolFavorites(userId: string) {
    const profile = await this.db.use((db) =>
      db.query.schoolProfiles.findFirst({
        where: { userId },
        columns: {},
        with: {
          favorites: {
            columns: { userId: true },
          },
        },
      })
    );
    return profile?.favorites.map((f) => f.userId) ?? [];
  }

  async getFeed(following: string[], cursor?: string) {
    return this.db.use((db) =>
      db.query.feed.findMany({
        columns: {
          contentType: true,
          contentId: true,
          createdAt: true,
        },
        where: {
          userId: { in: following },
          user: true,
          ...(cursor && {
            createdAt: { lt: new Date(cursor) },
          }),
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
                columns: { name: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        limit: PAGE_SIZE,
      })
    );
  }

  async fetchAllContent(groupedByType: Map<ContentType, string[]>) {
    const contentMap = new Map<string, ContentData>();
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

  async fetchContentByType(
    type: ContentType,
    ids: string[]
  ): Promise<ContentData[]> {
    return this.db.use(async (db) => {
      switch (type) {
        case "image":
          return this.fetchImages(db, ids);
        case "video":
          return this.fetchVideos(db, ids);
        case "achievement":
          return this.fetchAchievements(db, ids);
        case "reference":
          return this.fetchReferences(db, ids);
        case "profile":
          return this.fetchProfiles(db, ids);
        default:
          console.warn(`Unknown content type: ${type}`);
          return [];
      }
    });
  }

  private async fetchImages(
    db: Parameters<Parameters<DatabaseService["use"]>[0]>[0],
    ids: string[]
  ) {
    const images = await db.query.images.findMany({
      where: { id: { in: ids } },
      columns: { id: true, caption: true, mediaUrl: true },
    });
    return images.map((image) => ({
      id: image.id,
      caption: image.caption,
      content: image.mediaUrl,
    }));
  }

  private async fetchVideos(
    db: Parameters<Parameters<DatabaseService["use"]>[0]>[0],
    ids: string[]
  ) {
    const videos = await db.query.videos.findMany({
      where: { id: { in: ids } },
      columns: { id: true, caption: true, mediaId: true },
    });
    return videos.map((video) => ({
      id: video.id,
      caption: video.caption,
      content: video.mediaId,
    }));
  }

  private async fetchAchievements(
    db: Parameters<Parameters<DatabaseService["use"]>[0]>[0],
    ids: string[]
  ) {
    const achievements = await db.query.achievements.findMany({
      where: { id: { in: ids } },
      columns: { id: true, title: true, description: true },
    });
    return achievements.map((achievement) => ({
      id: achievement.id,
      caption: achievement.title,
      content: achievement.description,
    }));
  }

  private async fetchReferences(
    db: Parameters<Parameters<DatabaseService["use"]>[0]>[0],
    ids: string[]
  ) {
    const references = await db.query.references.findMany({
      where: { id: { in: ids } },
      columns: { id: true, name: true, title: true, description: true },
    });
    return references.map((reference) => ({
      id: reference.id,
      caption: reference.name + " - " + reference.title,
      content: reference.description,
    }));
  }

  private async fetchProfiles(
    db: Parameters<Parameters<DatabaseService["use"]>[0]>[0],
    ids: string[]
  ) {
    const profiles = await db.query.schoolProfiles.findMany({
      where: { id: { in: ids } },
      columns: { id: true, name: true },
    });
    return profiles.map((profile) => ({
      id: profile.id,
      caption: profile.name,
      content: "Updated profile",
    }));
  }
}
