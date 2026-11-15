import logger from "@adonisjs/core/services/logger";
import redis from "@adonisjs/redis/services/main";
import * as Sentry from "@sentry/node";

/**
 * Unsubscribe a closed SSE stream from its Redis channel. The cleanup that
 * calls this runs from a socket "close" handler, outside any request, so a
 * rejection (Redis slow or down) is logged here rather than left unhandled.
 */
export async function unsubscribeStream(channel: string) {
  try {
    await redis.unsubscribe(channel);
  } catch (error) {
    logger.error({ err: error, channel }, "Failed to unsubscribe SSE stream");
    Sentry.captureException(error, { extra: { channel } });
  }
}
