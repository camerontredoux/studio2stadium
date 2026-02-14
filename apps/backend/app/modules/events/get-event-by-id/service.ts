import { danceEventAttendees } from "#database/schema/events";
import { DatabaseService } from "#database/service";
import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { getDateAndTime } from "#utils/date";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

type Event = NonNullable<Awaited<ReturnType<Service["getEventById"]>>>;

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params: { id } }: Validator, userId: string) {
    const event = await this.getEventById(id, userId);

    if (!event) {
      throw new E_BAD_REQUEST("No event found with that ID");
    }

    return this.formatEvent(event);
  }

  async getEventById(id: string, userId: string) {
    return this.db.use((db) =>
      db.query.danceEvents.findFirst({
        where: {
          id,
        },
        with: {
          schedule: true,
          organizer: {
            columns: {
              name: true,
            },
            with: {
              user: {
                columns: {
                  username: true,
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
        extras: {
          eventAttendees: (table) =>
            db.$count(
              danceEventAttendees,
              eq(table.id, danceEventAttendees.eventId)
            ),
        },
      })
    );
  }

  formatEvent({
    organizer,
    schedule,
    startDatetime,
    endDatetime,
    ...event
  }: Event) {
    if (!organizer || !organizer.user)
      throw new E_BAD_REQUEST("Events must have an organizer");

    const { time: startTime, date: startDate } = getDateAndTime(startDatetime);
    const { time: endTime, date: endDate } = getDateAndTime(endDatetime);

    return {
      ...event,
      startTime,
      endTime,
      startDate,
      endDate,
      organizer: {
        name: organizer.name,
        username: organizer.user.username,
        avatar: organizer.user.avatar,
      },
      ...(schedule?.schedule && {
        schedule: schedule.schedule,
      }),
      saved: event.attendees.length > 0,
      attendees: event.eventAttendees,
    };
  }
}
