import { outboxService } from "#database/outbox-service";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";

interface CrvSubmissionEventData {
  dancerId: string;
  schoolId: string;
  videoId: string;
}

export class CrvSubmissionEvent extends BaseEvent {
  constructor(public data: CrvSubmissionEventData) {
    super();
  }
}

class CrvSubmissionHandler {
  async handle(event: CrvSubmissionEvent) {
    const { dancerId, schoolId, videoId } = event.data;

    await outboxService.publish({
      type: "crv.submission",
      payload: { dancerId, schoolId, videoId },
    });
  }
}

emitter.listen(CrvSubmissionEvent, [CrvSubmissionHandler]);
