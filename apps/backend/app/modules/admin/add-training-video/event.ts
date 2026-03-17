import { outboxService } from "#database/outbox-service";
import cache from "@adonisjs/cache/services/main";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";

interface TrainingVideoAddedEventData {
  videoId: string;
}

export class TrainingVideoAddedEvent extends BaseEvent {
  constructor(public data: TrainingVideoAddedEventData) {
    super();
  }
}

class TrainingVideoAddedHandler {
  async handle(event: TrainingVideoAddedEvent) {
    await cache.delete({ key: "library:videos" });

    await outboxService.publish({
      type: "library.video-added",
      payload: { videoId: event.data.videoId },
    });
  }
}

emitter.listen(TrainingVideoAddedEvent, [TrainingVideoAddedHandler]);
