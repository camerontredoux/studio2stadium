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

  formatEvent({ startDatetime, ...event }: Event) {
    const { time, date } = getDateAndTime(startDatetime);

    return {
      ...event,
      thumbnail: imageUrl(event.thumbnail, "thumbnail"),
      date,
      time,
    };
  }

  async findEvents() {
    return await this.db.use((db) =>
      db.query.globalDanceEvents.findMany({
        where: {
          startDatetime: {
            gt: new Date(),
          },
        },
        columns: {
          id: true,
          title: true,
          thumbnail: true,
          startDatetime: true,
          location: true,
          type: true,
        },
        orderBy: {
          startDatetime: "asc",
        },
        limit: 3,
      })
    );
  }
}
