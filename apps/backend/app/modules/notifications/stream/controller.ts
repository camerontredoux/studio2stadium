import { getUserChannel, type RealtimeEvent } from "#shared/realtime/pubsub";
import type { HttpContext } from "@adonisjs/core/http";
import redis from "@adonisjs/redis/services/main";

/**
 * SSE endpoint for realtime notifications.
 * Clients connect to this endpoint and receive events as they happen.
 */
export default class StreamController {
  async handle({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail();
    const channel = getUserChannel(user.id);

    const origin = request.header("origin");
    if (origin) {
      response.response.setHeader("Access-Control-Allow-Origin", origin);
      response.response.setHeader("Access-Control-Allow-Credentials", "true");
    }

    response.response.setHeader("Content-Type", "text/event-stream");
    response.response.setHeader("Cache-Control", "no-cache");
    response.response.setHeader("Connection", "keep-alive");
    response.response.setHeader("X-Accel-Buffering", "no");

    // Send initial connection event
    response.response.write(`event: connected\ndata: {}\n\n`);

    let cleanedUp = false;

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      clearInterval(heartbeat);
      redis.unsubscribe(channel);
    };

    const messageHandler = (message: string) => {
      try {
        const event = JSON.parse(message) as RealtimeEvent;
        response.response.write(`event: ${event.type}\ndata: ${message}\n\n`);

        if (event.type === "video.ready" || event.type === "video.failed") {
          cleanup();
          response.response.end();
        }
      } catch {}
    };

    redis.subscribe(channel, messageHandler);

    const heartbeat = setInterval(() => {
      response.response.write(`:heartbeat\n\n`);
    }, 30000);

    response.response.on("close", cleanup);

    return new Promise(() => {});
  }
}
