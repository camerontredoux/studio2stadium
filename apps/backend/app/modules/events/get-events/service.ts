import { DatabaseService } from "#database/service";
import { getDateAndTime } from "#utils/date";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";

type Event = Awaited<ReturnType<Service["findEvents"]>>[number];
type FormattedEvent = Awaited<ReturnType<Service["formatEvent"]>>;

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(userId: string) {
    const events = await this.findEvents(userId);

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
        thumbnail: imageUrl(organizer?.user?.avatar, {
          fit: "cover",
          width: 320,
          height: 320,
        }),
      },
      saved: event.attendees.length > 0,
    };
  }

  async findEvents(userId: string) {
    return await this.db.use((db) =>
      db.query.danceEvents.findMany({
        where: {
          startDatetime: {
            gt: new Date(),
          },
          organizer: {
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
}
