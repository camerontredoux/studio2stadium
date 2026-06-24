import env from "#start/env";
import cache from "@adonisjs/cache/services/main";
import { BaseEvent } from "@adonisjs/core/events";
import app from "@adonisjs/core/services/app";
import emitter from "@adonisjs/core/services/emitter";
import logger from "@adonisjs/core/services/logger";

interface BlogPostDeletedEventData {
  postId: string;
}

export class BlogPostDeletedEvent extends BaseEvent {
  constructor(public data: BlogPostDeletedEventData) {
    super();
  }
}

class BlogPostDeletedHandler {
  async handle(_event: BlogPostDeletedEvent) {
    if (app.inProduction) {
      const res = await fetch(env.get("CLOUDFLARE_DEPLOY_HOOK"), { method: "POST" });
      if (!res.ok) {
        logger.error({ status: res.status, body: await res.text() }, "Cloudflare deploy hook failed (blog deleted)");
      }
    }

    await cache.delete({ key: "blog:posts" });
  }
}

emitter.listen(BlogPostDeletedEvent, [BlogPostDeletedHandler]);
