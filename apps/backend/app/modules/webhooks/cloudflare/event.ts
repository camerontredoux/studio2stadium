import { outboxService } from "#database/outbox-service";
import { publishToUser } from "#shared/realtime/pubsub";
import { BaseEvent } from "@adonisjs/core/events";
import emitter from "@adonisjs/core/services/emitter";

interface VideoReadyEventData {
  userId: string;
  videoId: string;
  cloudflareMediaId: string;
}

interface VideoFailedEventData {
  userId: string;
  cloudflareMediaId: string;
  errorMessage: string;
}

export class VideoReadyEvent extends BaseEvent {
  constructor(public data: VideoReadyEventData) {
    super();
  }
}

export class VideoFailedEvent extends BaseEvent {
  constructor(public data: VideoFailedEventData) {
    super();
  }
}

class VideoReadyHandler {
  async handle(event: VideoReadyEvent) {
    const { userId, videoId } = event.data;

    // Publish to outbox for persistent notification
    await outboxService.publish({
      type: "video.ready",
      payload: { userId, videoId },
    });

    // Publish to Redis for immediate SSE delivery
    await publishToUser(userId, { type: "video.ready", videoId });
  }
}

class VideoFailedHandler {
  async handle(event: VideoFailedEvent) {
    const { userId, errorMessage } = event.data;

    // Publish to outbox for persistent notification
    await outboxService.publish({
      type: "video.failed",
      payload: { userId, errorMessage },
    });

    // Publish to Redis for immediate SSE delivery
    await publishToUser(userId, { type: "video.failed", errorMessage });
  }
}

emitter.listen(VideoReadyEvent, [VideoReadyHandler]);
emitter.listen(VideoFailedEvent, [VideoFailedHandler]);
