import cache from "@adonisjs/cache/services/main";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";

interface TrainingVideoDeletedEventData {
  videoId: string;
}

export class TrainingVideoDeletedEvent extends BaseEvent {
  constructor(public data: TrainingVideoDeletedEventData) {
    super();
  }
}

class TrainingVideoDeletedHandler {
  async handle(_event: TrainingVideoDeletedEvent) {
    await cache.delete({ key: "library:videos" });
  }
}

emitter.listen(TrainingVideoDeletedEvent, [TrainingVideoDeletedHandler]);
