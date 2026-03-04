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

    // Set CORS headers manually for SSE (streaming bypasses normal middleware)
    const origin = request.header("origin");
    if (origin) {
      response.response.setHeader("Access-Control-Allow-Origin", origin);
      response.response.setHeader("Access-Control-Allow-Credentials", "true");
    }

    // Set SSE headers
    response.response.setHeader("Content-Type", "text/event-stream");
    response.response.setHeader("Cache-Control", "no-cache");
    response.response.setHeader("Connection", "keep-alive");
    response.response.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

    // Send initial connection event
    response.response.write(`event: connected\ndata: {}\n\n`);

    // Subscribe to user's channel
    redis.subscribe(channel, (message: string) => {
      try {
        const event = JSON.parse(message) as RealtimeEvent;
        response.response.write(`event: ${event.type}\ndata: ${message}\n\n`);
      } catch {
        // Ignore malformed messages
      }
    });

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
      response.response.write(`:heartbeat\n\n`);
    }, 30000);

    // Cleanup on disconnect
    response.response.on("close", async () => {
      clearInterval(heartbeat);
      await redis.unsubscribe(channel);
    });

    // Don't let AdonisJS finalize the response - we're streaming
    return new Promise(() => {});
  }
}
