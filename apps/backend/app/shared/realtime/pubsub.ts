import { withRedisKeyPrefix } from "#shared/redis/key-prefix";
import redis from "@adonisjs/redis/services/main";

export type RealtimeEvent =
  | { type: "video.ready"; videoId: string }
  | { type: "video.failed"; errorMessage: string };

/**
 * Returns the Redis channel name for a user's realtime events.
 *
 * ioredis keyPrefix does not apply to pub/sub channels, so REDIS_KEY_PREFIX is
 * added here. Otherwise staging (same Redis, same user ids) would deliver
 * events to prod's SSE streams.
 */
export function getUserChannel(userId: string): string {
  return withRedisKeyPrefix(`realtime:user:${userId}`);
}

/**
 * Publishes a realtime event to a user's channel via Redis pub/sub.
 * SSE connections subscribe to these channels for immediate updates.
 */
export async function publishToUser(
  userId: string,
  event: RealtimeEvent
): Promise<void> {
  const channel = getUserChannel(userId);
  await redis.publish(channel, JSON.stringify(event));
}
