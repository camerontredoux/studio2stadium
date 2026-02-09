import { DatabaseService } from "#database/service";
import { getDateAndTime } from "#utils/date";
import { inject } from "@adonisjs/core";

type Event = Awaited<ReturnType<Service["findEvents"]>>[number];

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute() {
    const events = await this.findEvents();

    return events.map(this.formatEvent);
  }

  formatEvent({ endDatetime, startDatetime, ...event }: Event) {
    const { time: startTime, date: startDate } = getDateAndTime(startDatetime);
    const { time: endTime, date: endDate } = getDateAndTime(endDatetime);

    return {
      ...event,
      startTime,
      endTime,
      startDate,
      endDate,
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
          endDatetime: true,
          location: true,
          organization: true,
          description: true,
          website: true,
          type: true,
        },
        orderBy: {
          startDatetime: "asc",
        },
      })
    );
  }
}
