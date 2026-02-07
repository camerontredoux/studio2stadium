import { DatabaseService } from "#database/service";
import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

type Event = NonNullable<Awaited<ReturnType<Service["getEventById"]>>>;

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params: { id } }: Validator) {
    const event = await this.getEventById(id);

    if (!event) {
      throw new E_BAD_REQUEST("No event found with that ID");
    }

    return this.formatEvent(event);
  }

  async getEventById(id: string) {
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
        },
      })
    );
  }

  formatEvent({ organizer, schedule, ...event }: Event) {
    if (!organizer || !organizer.user)
      throw new E_BAD_REQUEST("Events must have an organizer");

    return {
      ...event,
      organizer: {
        name: organizer.name,
        username: organizer.user.username,
        avatar: organizer.user.avatar,
      },
      ...(schedule?.schedule && {
        schedule: schedule.schedule,
      }),
    };
  }
}
