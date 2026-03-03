import { outboxService } from "#database/outbox-service";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";

interface DancerReferenceEventData {
  dancerId: string;
}

export class DancerReferenceEvent extends BaseEvent {
  constructor(public data: DancerReferenceEventData) {
    super();
  }
}

class DancerReferenceHandler {
  async handle(event: DancerReferenceEvent) {
    await outboxService.publish({
      type: "dancer.reference-added",
      payload: { dancerId: event.data.dancerId },
    });
  }
}

emitter.listen(DancerReferenceEvent, [DancerReferenceHandler]);
