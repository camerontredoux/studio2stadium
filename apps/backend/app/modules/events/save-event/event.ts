import { outboxService } from "#database/outbox-service";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";

interface EventAttendedEventData {
  userId: string;
  eventId: string;
}

export class EventAttendedEvent extends BaseEvent {
  constructor(public data: EventAttendedEventData) {
    super();
  }
}

class EventAttendedHandler {
  async handle(event: EventAttendedEvent) {
    const { userId, eventId } = event.data;

    await outboxService.publish({
      type: "event.attended",
      payload: { userId, eventId },
    });
  }
}

emitter.listen(EventAttendedEvent, [EventAttendedHandler]);
