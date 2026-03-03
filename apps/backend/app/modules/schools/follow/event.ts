import { outboxService } from "#database/outbox-service";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";

interface FollowSchoolEventData {
  dancerId: string;
  schoolId: string;
}

export class FollowSchoolEvent extends BaseEvent {
  constructor(public data: FollowSchoolEventData) {
    super();
  }
}

class FollowSchoolHandler {
  async handle(event: FollowSchoolEvent) {
    const { dancerId, schoolId } = event.data;

    await outboxService.publish({
      type: "school.followed",
      payload: { dancerId, schoolId },
    });
  }
}

emitter.listen(FollowSchoolEvent, [FollowSchoolHandler]);
