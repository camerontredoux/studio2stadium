import { globalDanceEventAttendees } from "#database/schema/events";
import { DatabaseService } from "#database/service";
import { getDateAndTime } from "#utils/date";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";

type Event = Awaited<ReturnType<Service["findEvents"]>>[number];

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(userId: string) {
    const events = await this.findEvents(userId);

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
      saved: event.attendees.length > 0,
      attendees: event.eventAttendees,
    };
  }

  async findEvents(userId: string) {
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
        with: {
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
        extras: {
          eventAttendees: (table) =>
            db.$count(
              globalDanceEventAttendees,
              eq(table.id, globalDanceEventAttendees.eventId)
            ),
        },
      })
    );
  }
}
