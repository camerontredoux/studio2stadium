import { outboxService } from "#database/outbox-service";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";

interface SchoolEventCreatedEventData {
  schoolId: string;
  eventId: string;
}

export class SchoolEventCreatedEvent extends BaseEvent {
  constructor(public data: SchoolEventCreatedEventData) {
    super();
  }
}

class SchoolEventCreatedHandler {
  async handle(event: SchoolEventCreatedEvent) {
    await outboxService.publish({
      type: "school.event-created",
      payload: {
        schoolId: event.data.schoolId,
        eventId: event.data.eventId,
      },
    });
  }
}

emitter.listen(SchoolEventCreatedEvent, [SchoolEventCreatedHandler]);
