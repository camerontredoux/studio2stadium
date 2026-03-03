import { db } from "#database/connection";
import { DatabaseService } from "#database/service";
import { getDateAndTime } from "#utils/date";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";
import { type Validator } from "./validator.ts";

type Event = Awaited<ReturnType<Service["findEvents"]>>[number];
type FormattedEvent = Awaited<ReturnType<Service["formatEvent"]>>;

type DanceEventWhere = NonNullable<
  Parameters<typeof db.query.danceEvents.findMany>[0]
>["where"];

type OrganizerWhere = NonNullable<
  NonNullable<Extract<DanceEventWhere, { organizer?: unknown }>>["organizer"]
>;

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(userId: string, filters: Validator) {
    const events = await this.findEvents(userId, filters);

    const groupedEvents = events.reduce((acc, event) => {
      const month = event.startDatetime.toLocaleString("en-US", {
        month: "long",
      });

      if (!acc.get(month)) {
        acc.set(month, []);
      }

      const data = this.formatEvent(event);

      acc.get(month)?.push(data);

      return acc;
    }, new Map<string, FormattedEvent[]>());

    return Array.from(groupedEvents, ([month, monthEvents]) => ({
      month,
      events: monthEvents,
    }));
  }

  formatEvent({ organizer, startDatetime, ...event }: Event) {
    const { time, date } = getDateAndTime(startDatetime);

    return {
      ...event,
      date,
      time,
      organizer: {
        name: organizer?.name,
        thumbnail: imageUrl(organizer?.user?.avatar, "thumbnail"),
      },
      saved: event.attendees.length > 0,
    };
  }

  async findEvents(userId: string, filters: Validator) {
    const { eventWhere, organizerWhere } = this.buildFilters(filters);

    return await this.db.use((db) =>
      db.query.danceEvents.findMany({
        where: {
          ...eventWhere,
          organizer: {
            ...organizerWhere,
            user: {
              verified: true,
            },
          },
        },
        columns: {
          id: true,
          title: true,
          startDatetime: true,
          location: true,
          type: true,
        },
        with: {
          organizer: {
            columns: {
              name: true,
            },
            with: {
              user: {
                columns: {
                  avatar: true,
                },
              },
            },
          },
          attendees: {
            where: {
              id: userId,
            },
            columns: {
              id: true,
            },
          },
        },
        orderBy: {
          startDatetime: "asc",
        },
      })
    );
  }

  buildFilters(filters: Validator) {
    const eventWhere: DanceEventWhere = {
      startDatetime: {
        gt: new Date(),
      },
    };

    if (filters.date) {
      const filterDate = new Date(filters.date);
      const nextDay = new Date(filters.date);
      nextDay.setDate(nextDay.getDate() + 1);

      eventWhere.startDatetime = {
        gte: filterDate,
        lt: nextDay,
      };
    }

    const organizerWhere: OrganizerWhere = {};

    if (filters.location) {
      organizerWhere.location = filters.location;
    }

    if (filters.schoolName) {
      organizerWhere.name = {
        ilike: `%${filters.schoolName}%`,
      };
    }

    return { eventWhere, organizerWhere };
  }
}
