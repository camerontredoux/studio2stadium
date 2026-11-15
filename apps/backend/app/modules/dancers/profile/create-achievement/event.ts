import { outboxService } from "#database/outbox-service";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";
import { guardListener } from "#shared/events/guard-listener";

interface DancerAchievementEventData {
  dancerId: string;
}

export class DancerAchievementEvent extends BaseEvent {
  constructor(public data: DancerAchievementEventData) {
    super();
  }
}

class DancerAchievementHandler {
  async handle(event: DancerAchievementEvent) {
    await outboxService.publish({
      type: "dancer.achievement-added",
      payload: { dancerId: event.data.dancerId },
    });
  }
}

emitter.listen(DancerAchievementEvent, [
  guardListener(DancerAchievementHandler),
]);
