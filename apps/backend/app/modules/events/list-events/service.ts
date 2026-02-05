import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

type Event = Awaited<ReturnType<Service["findEvents"]>>[number];
type FormattedEvent = Awaited<ReturnType<Service["formatEvent"]>>;

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute() {
    const events = await this.findEvents();

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

    return Array.from(groupedEvents, ([month, events]) => ({ month, events }));
  }

  formatEvent({ organizer, startDatetime, ...event }: Event) {
    const time = startDatetime.toLocaleString("en-US", {
      timeStyle: "short",
    });

    const date = startDatetime.toLocaleString("en-US", {
      dateStyle: "medium",
    });

    return {
      ...event,
      date,
      time,
      organizer: {
        name: organizer?.name,
        thumbnail: organizer?.user?.avatar,
      },
    };
  }

  async findEvents() {
    return await this.db.use((db) =>
      db.query.danceEvents.findMany({
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
        },
        orderBy: {
          startDatetime: "asc",
        },
      })
    );
  }
}
