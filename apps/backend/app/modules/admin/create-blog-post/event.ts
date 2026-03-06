import { outboxService } from "#database/outbox-service";
import env from "#start/env";
import cache from "@adonisjs/cache/services/main";
import { BaseEvent } from "@adonisjs/core/events";
import app from "@adonisjs/core/services/app";
import emitter from "@adonisjs/core/services/emitter";

interface BlogPostCreatedEventData {
  postId: string;
}

export class BlogPostCreatedEvent extends BaseEvent {
  constructor(public data: BlogPostCreatedEventData) {
    super();
  }
}

class BlogPostCreatedHandler {
  async handle(event: BlogPostCreatedEvent) {
    if (app.inProduction) {
      await fetch(env.get("CLOUDFLARE_DEPLOY_HOOK"), { method: "POST" });
    }

    await cache.delete({ key: "blog:posts" });
    await outboxService.publish({
      type: "blog.post-created",
      payload: { postId: event.data.postId },
    });
  }
}

emitter.listen(BlogPostCreatedEvent, [BlogPostCreatedHandler]);
