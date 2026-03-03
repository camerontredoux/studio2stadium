import { outboxService } from "#database/outbox-service";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";

interface ImageUploadEventData {
  profileId: string;
  userType: "dancer" | "school";
}

export class ImageUploadEvent extends BaseEvent {
  constructor(public data: ImageUploadEventData) {
    super();
  }
}

class ImageUploadHandler {
  async handle(event: ImageUploadEvent) {
    const { profileId, userType } = event.data;

    if (userType === "dancer") {
      await outboxService.publish({
        type: "dancer.image-uploaded",
        payload: { dancerId: profileId },
      });
    } else if (userType === "school") {
      await outboxService.publish({
        type: "school.image-uploaded",
        payload: { schoolId: profileId },
      });
    }
  }
}

emitter.listen(ImageUploadEvent, [ImageUploadHandler]);
