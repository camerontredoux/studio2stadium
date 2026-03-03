import { outboxService } from "#database/outbox-service";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";

interface VideoUploadEventData {
  profileId: string;
  userType: "dancer" | "school";
}

export class VideoUploadEvent extends BaseEvent {
  constructor(public data: VideoUploadEventData) {
    super();
  }
}

class VideoUploadHandler {
  async handle(event: VideoUploadEvent) {
    const { profileId, userType } = event.data;

    if (userType === "dancer") {
      await outboxService.publish({
        type: "dancer.video-uploaded",
        payload: { dancerId: profileId },
      });
    } else if (userType === "school") {
      await outboxService.publish({
        type: "school.video-uploaded",
        payload: { schoolId: profileId },
      });
    }
  }
}

emitter.listen(VideoUploadEvent, [VideoUploadHandler]);
