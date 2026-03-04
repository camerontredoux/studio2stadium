import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { videoThumbnailUrl, videoUrl } from "#utils/video-url";
import { inject } from "@adonisjs/core";
import { sql } from "drizzle-orm";

const PAGE_SIZE = 10;

type FeedRow = {
  content_type: "image" | "video" | "achievement" | "reference" | "profile";
  content_id: string;
  created_at: string;
  username: string;
  avatar: string | null;
  first_name: string;
  last_name: string;
  school_name: string | null;
  caption: string | null;
  content: string | null;
  video_type: "youtube" | "cloudflare" | null;
};

type FeedItemResponse = {
  id: string;
  contentType: FeedRow["content_type"];
  createdAt: string;
  username: string;
  avatar: string | null;
  name: string | null;
  caption: string | null;
  content: string | null;
  thumbnail: string | null;
};

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(type: "dancer" | "school", userId: string, cursor?: string) {
    const following = await this.getFollowing(type, userId);

    if (following.length === 0) {
      return { feed: [], nextCursor: undefined };
    }

    const feed = await this.getFeedWithContent(following, cursor);
    const items = this.mapFeedItems(feed, type);
    const nextCursor = this.calculateNextCursor(feed);

    return { feed: items, nextCursor };
  }

  async getFeedWithContent(
    following: string[],
    cursor?: string
  ): Promise<FeedRow[]> {
    return this.db.use(async (db) => {
      const rows = await db.execute<FeedRow>(sql`
        SELECT
          f.content_type,
          f.content_id,
          to_char(f.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at,
          u.username,
          u.avatar,
          u.first_name,
          u.last_name,
          sp.name AS school_name,
          COALESCE(
            i.caption,
            v.caption,
            a.title,
            r.name || ' - ' || r.title,
            p.name
          ) AS caption,
          COALESCE(
            i.media_url,
            v.media_id,
            a.description,
            r.description,
            'Updated profile'
          ) AS content,
          v.type AS video_type
        FROM feed f
        JOIN users u ON f.user_id = u.id
        LEFT JOIN school_profiles sp ON u.id = sp.user_id
        LEFT JOIN profile_images i ON f.content_type = 'image' AND f.content_id = i.id
        LEFT JOIN profile_videos v ON f.content_type = 'video' AND f.content_id = v.id
        LEFT JOIN dancer_achievements a ON f.content_type = 'achievement' AND f.content_id = a.id
        LEFT JOIN dancer_references r ON f.content_type = 'reference' AND f.content_id = r.id
        LEFT JOIN school_profiles p ON f.content_type = 'profile' AND f.content_id = p.id
        WHERE f.user_id IN (${sql.join(
          following.map((id) => sql`${id}::uuid`),
          sql`, `
        )})
        ${cursor ? sql`AND f.created_at < ${cursor}::timestamptz` : sql``}
        ORDER BY f.created_at DESC
        LIMIT ${PAGE_SIZE}
      `);

      return [...rows];
    });
  }

  mapFeedItems(feed: FeedRow[], type: "dancer" | "school"): FeedItemResponse[] {
    return feed.map((row) => ({
      id: row.content_id,
      contentType: row.content_type,
      createdAt: row.created_at,
      username: row.username,
      avatar: imageUrl(row.avatar, "avatar"),
      name: this.getDisplayName(row, type),
      caption: row.caption,
      content: this.getContent(row),
      thumbnail: this.getThumbnail(row),
    }));
  }

  getContent(row: FeedRow): string | null {
    if (row.content_type === "image") {
      return imageUrl(row.content, "feed");
    }
    if (row.content_type === "video" && row.video_type) {
      return videoUrl(row.content, row.video_type);
    }
    return row.content;
  }

  getThumbnail(row: FeedRow): string | null {
    if (row.content_type === "image") {
      return imageUrl(row.content, "thumbnail");
    }
    if (row.content_type === "video" && row.video_type) {
      return videoThumbnailUrl(row.content, row.video_type);
    }
    return null;
  }

  getDisplayName(row: FeedRow, type: "dancer" | "school"): string | null {
    return type === "dancer"
      ? row.school_name
      : row.first_name + " " + row.last_name;
  }

  calculateNextCursor(feed: FeedRow[]): string | undefined {
    return feed.length === PAGE_SIZE
      ? feed[feed.length - 1].created_at
      : undefined;
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
        columns: { id: true },
      })
    );

    if (!profile) return [];

    // Query favorites directly to get dancer user IDs
    const favorited = await this.db.use((db) =>
      db.query.favorites.findMany({
        where: { schoolId: profile.id },
        columns: {},
        with: {
          dancer: {
            columns: { userId: true },
          },
        },
      })
    );

    return favorited
      .filter((f) => f.dancer !== null)
      .map((f) => f.dancer!.userId);
  }
}
