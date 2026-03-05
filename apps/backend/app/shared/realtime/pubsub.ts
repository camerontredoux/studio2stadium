import redis from "@adonisjs/redis/services/main";

export type RealtimeEvent =
  | { type: "video.ready"; videoId: string }
  | { type: "video.failed"; errorMessage: string };

/**
 * Returns the Redis channel name for a user's realtime events.
 */
export function getUserChannel(userId: string): string {
  return `realtime:user:${userId}`;
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
