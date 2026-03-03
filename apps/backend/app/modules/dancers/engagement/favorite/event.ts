import { outboxService } from "#database/outbox-service";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";

interface FavoriteEventData {
  schoolId: string;
  dancerId: string;
  platform: "core" | "prodigy";
}

export class FavoriteEvent extends BaseEvent {
  constructor(public data: FavoriteEventData) {
    super();
  }
}

class FavoriteHandler {
  async handle(event: FavoriteEvent) {
    const { schoolId, dancerId, platform } = event.data;

    await outboxService.publish({
      type: "dancer.favorite",
      payload: { schoolId, dancerId, platform },
    });
  }
}

emitter.listen(FavoriteEvent, [FavoriteHandler]);
