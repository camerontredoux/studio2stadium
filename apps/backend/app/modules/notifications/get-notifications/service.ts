import { db } from "#database/connection";
import { notifications } from "#database/schema/notifications";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";
import { and, desc, eq, gte, lt } from "drizzle-orm";

// Content types stored by the Go event processor
type NotificationContent =
  | { type: "school.interest"; dancerId: string }
  | { type: "dancer.favorite"; schoolId: string; platform: string }
  | { type: "school.followed"; dancerId: string }
  | { type: "crv.submission"; dancerId: string; videoId: string }
  | { type: "dancer.profile-viewed"; schoolId: string }
  | { type: "dancer.prospect-status"; schoolId: string; status: string }
  | {
      type:
        | "dancer.image-uploaded"
        | "dancer.video-uploaded"
        | "dancer.reference-added"
        | "dancer.achievement-added";
      dancerId: string;
      updateType: string;
    }
  | { type: "school.event-created"; schoolId: string; eventId: string }
  | {
      type: "school.image-uploaded" | "school.video-uploaded";
      schoolId: string;
      updateType: string;
    }
  | { type: "event.attended"; userId: string; eventId: string }
  | { type: "video.ready"; videoId: string }
  | { type: "video.failed"; errorMessage: string };

type EnrichedNotification = {
  id: string;
  type: string;
  createdAt: Date;
  read: boolean;
  actor: {
    name: string;
    username: string;
    avatar: string | null;
    profileUrl: string;
  } | null;
  message: string;
  link: string | null;
  metadata?: Record<string, unknown>;
};

type PaginatedResponse = {
  data: EnrichedNotification[];
  nextCursor: string | null;
};

const PAGE_SIZE = 20;

@inject()
export class Service {
  async execute(userId: string, cursor?: string): Promise<PaginatedResponse> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const cursorDate = cursor ? new Date(cursor) : null;

    const conditions = [
      eq(notifications.userId, userId),
      gte(notifications.createdAt, thirtyDaysAgo),
    ];

    if (cursorDate) {
      conditions.push(lt(notifications.createdAt, cursorDate));
    }

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(PAGE_SIZE + 1);

    const hasMore = userNotifications.length > PAGE_SIZE;
    const notificationsToProcess = hasMore
      ? userNotifications.slice(0, PAGE_SIZE)
      : userNotifications;

    const enriched: EnrichedNotification[] = [];

    for (const notif of notificationsToProcess) {
      const content = notif.content as NotificationContent;
      const result = await this.enrichNotification(
        notif.id,
        content,
        notif.createdAt,
        notif.seenAt !== null
      );
      if (result) {
        enriched.push(result);
      }
    }

    const lastNotification = enriched[enriched.length - 1];
    const nextCursor =
      hasMore && lastNotification
        ? lastNotification.createdAt.toISOString()
        : null;

    return { data: enriched, nextCursor };
  }

  private async enrichNotification(
    id: string,
    content: NotificationContent,
    createdAt: Date,
    read: boolean
  ): Promise<EnrichedNotification | null> {
    switch (content.type) {
      case "school.interest":
        return this.enrichDancerNotification(
          id,
          content.type,
          content.dancerId,
          createdAt,
          read,
          {
            message: "showed interest in your school",
          }
        );

      case "dancer.favorite":
        return this.enrichSchoolNotification(
          id,
          content.type,
          content.schoolId,
          createdAt,
          read,
          {
            message: "added you to their favorites",
            metadata: { platform: content.platform },
          }
        );

      case "school.followed":
        return this.enrichDancerNotification(
          id,
          content.type,
          content.dancerId,
          createdAt,
          read,
          {
            message: "followed your school",
          }
        );

      case "crv.submission":
        return this.enrichDancerNotification(
          id,
          content.type,
          content.dancerId,
          createdAt,
          read,
          {
            message: "submitted a recruiting video",
            link: `/recruiting/submissions`,
            metadata: { videoId: content.videoId },
          }
        );

      case "dancer.profile-viewed":
        return this.enrichSchoolNotification(
          id,
          content.type,
          content.schoolId,
          createdAt,
          read,
          {
            message: "viewed your profile",
          }
        );

      case "dancer.prospect-status":
        return this.enrichSchoolNotification(
          id,
          content.type,
          content.schoolId,
          createdAt,
          read,
          {
            message: `updated your status to ${content.status}`,
            metadata: { status: content.status },
          }
        );

      case "dancer.image-uploaded":
      case "dancer.video-uploaded":
      case "dancer.reference-added":
      case "dancer.achievement-added":
        return this.enrichDancerNotification(
          id,
          content.type,
          content.dancerId,
          createdAt,
          read,
          {
            message: this.getProfileUpdateMessage(content.updateType),
          }
        );

      case "school.event-created":
        return this.enrichSchoolNotificationWithEvent(
          id,
          content.type,
          content.schoolId,
          content.eventId,
          createdAt,
          read
        );

      case "school.image-uploaded":
      case "school.video-uploaded":
        return this.enrichSchoolNotification(
          id,
          content.type,
          content.schoolId,
          createdAt,
          read,
          {
            message: `uploaded a new ${content.updateType}`,
          }
        );

      case "event.attended":
        return this.enrichEventAttendedNotification(
          id,
          content.type,
          content.userId,
          content.eventId,
          createdAt,
          read
        );

      case "video.ready":
        return this.enrichVideoReadyNotification(
          id,
          content.type,
          content.videoId,
          createdAt,
          read
        );

      case "video.failed":
        return this.enrichVideoFailedNotification(
          id,
          content.type,
          content.errorMessage,
          createdAt,
          read
        );

      default:
        return null;
    }
  }

  private async enrichDancerNotification(
    id: string,
    type: string,
    dancerId: string,
    createdAt: Date,
    read: boolean,
    options: {
      message: string;
      link?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<EnrichedNotification | null> {
    const dancer = await db.query.dancerProfiles.findFirst({
      where: { id: dancerId },
      columns: { id: true },
      with: {
        user: {
          columns: {
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!dancer || !dancer.user) return null;

    return {
      id,
      type,
      createdAt,
      read,
      actor: {
        name: `${dancer.user.firstName} ${dancer.user.lastName}`,
        username: dancer.user.username,
        avatar: imageUrl(dancer.user.avatar, "avatar"),
        profileUrl: `/${dancer.user.username}`,
      },
      message: options.message,
      link: options.link ?? `/${dancer.user.username}`,
      metadata: options.metadata,
    };
  }

  private async enrichSchoolNotification(
    id: string,
    type: string,
    schoolId: string,
    createdAt: Date,
    read: boolean,
    options: {
      message: string;
      link?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<EnrichedNotification | null> {
    const school = await db.query.schoolProfiles.findFirst({
      where: { id: schoolId },
      columns: { id: true, name: true },
      with: {
        user: {
          columns: {
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!school || !school.user) return null;

    return {
      id,
      type,
      createdAt,
      read,
      actor: {
        name: school.name,
        username: school.user.username,
        avatar: imageUrl(school.user.avatar, "avatar"),
        profileUrl: `/explore/${school.user.username}`,
      },
      message: options.message,
      link: options.link ?? `/explore/${school.user.username}`,
      metadata: options.metadata,
    };
  }

  private async enrichSchoolNotificationWithEvent(
    id: string,
    type: string,
    schoolId: string,
    eventId: string,
    createdAt: Date,
    read: boolean
  ): Promise<EnrichedNotification | null> {
    const [school, event] = await Promise.all([
      db.query.schoolProfiles.findFirst({
        where: { id: schoolId },
        columns: { id: true, name: true },
        with: {
          user: {
            columns: {
              username: true,
              avatar: true,
            },
          },
        },
      }),
      db.query.danceEvents.findFirst({
        where: { id: eventId },
        columns: { id: true, title: true },
      }),
    ]);

    if (!school || !school.user) return null;

    return {
      id,
      type,
      createdAt,
      read,
      actor: {
        name: school.name,
        username: school.user.username,
        avatar: imageUrl(school.user.avatar, "avatar"),
        profileUrl: `/explore/${school.user.username}`,
      },
      message: "created a new event",
      link: event ? `/events/${event.id}` : `/explore/${school.user.username}`,
      metadata: {
        eventId,
        eventTitle: event?.title,
        eventLink: event ? `/events/${event.id}` : null,
      },
    };
  }

  private async enrichEventAttendedNotification(
    id: string,
    type: string,
    attendeeUserId: string,
    eventId: string,
    createdAt: Date,
    read: boolean
  ): Promise<EnrichedNotification | null> {
    const [user, event] = await Promise.all([
      db.query.users.findFirst({
        where: { id: attendeeUserId },
        columns: {
          firstName: true,
          lastName: true,
          username: true,
          avatar: true,
        },
      }),
      db.query.danceEvents.findFirst({
        where: { id: eventId },
        columns: { id: true, title: true },
      }),
    ]);

    if (!user) return null;

    return {
      id,
      type,
      createdAt,
      read,
      actor: {
        name: `${user.firstName} ${user.lastName}`,
        username: user.username,
        avatar: imageUrl(user.avatar, "avatar"),
        profileUrl: `/${user.username}`,
      },
      message: "is attending your event",
      link: `/${user.username}`,
      metadata: {
        eventId,
        eventTitle: event?.title,
        eventLink: event ? `/events/${event.id}` : null,
      },
    };
  }

  private getProfileUpdateMessage(updateType: string): string {
    switch (updateType) {
      case "image":
        return "uploaded a new profile image";
      case "video":
        return "uploaded a new video";
      case "reference":
        return "added a new reference";
      case "achievement":
        return "added a new achievement";
      default:
        return "updated their profile";
    }
  }

  private async enrichVideoReadyNotification(
    id: string,
    type: string,
    videoId: string,
    createdAt: Date,
    read: boolean
  ): Promise<EnrichedNotification> {
    return {
      id,
      type,
      createdAt,
      read,
      actor: null,
      message: "Your video has finished processing and is now live",
      link: null,
      metadata: { videoId },
    };
  }

  private async enrichVideoFailedNotification(
    id: string,
    type: string,
    errorMessage: string,
    createdAt: Date,
    read: boolean
  ): Promise<EnrichedNotification> {
    return {
      id,
      type,
      createdAt,
      read,
      actor: null,
      message: `Your video failed to process: ${errorMessage}`,
      link: null,
      metadata: { errorMessage },
    };
  }
}
