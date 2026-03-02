import { DatabaseService } from "#database/service";
import { getDateAndTime } from "#utils/date";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";

type Event = Awaited<ReturnType<Service["findEvents"]>>[number];

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute() {
    const events = await this.findEvents();

    return events.map(this.formatEvent);
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
    };
  }

  async findEvents() {
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
        },
        orderBy: {
          startDatetime: "asc",
        },
        limit: 3,
      })
    );
  }
}
