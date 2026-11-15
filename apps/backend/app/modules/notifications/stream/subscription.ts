import logger from "@adonisjs/core/services/logger";
import redis from "@adonisjs/redis/services/main";
import * as Sentry from "@sentry/node";

type Listener = (message: string) => void;

interface ChannelEntry {
  listeners: Set<Listener>;
  dispatch: (message: string) => void;
}

/**
 * Every SSE stream for a user listens on the same Redis channel through the
 * shared subscriber connection. `redis.unsubscribe(channel)` drops every
 * handler on that channel, so this module keeps its own listener set per
 * channel and holds one Redis subscription for it. Closing one tab removes only
 * that tab's listener; the channel is released when the last listener leaves.
 *
 * Each entry has its own dispatcher. If a channel is released and then
 * re-subscribed before Redis answers, a stale dispatcher may linger in the
 * Redis client, but it reads the old, empty set and delivers nothing.
 */
const channels = new Map<string, ChannelEntry>();

export function subscribeStream(channel: string, listener: Listener) {
  let entry = channels.get(channel);
  if (!entry) {
    const listeners = new Set<Listener>();
    entry = {
      listeners,
      dispatch: (message) => {
        for (const fn of listeners) fn(message);
      },
    };
    channels.set(channel, entry);
    // Commands on one connection run in order, so a SUBSCRIBE sent after an
    // in-flight UNSUBSCRIBE for the same channel leaves it subscribed.
    redis.subscribe(channel, entry.dispatch);
  }
  entry.listeners.add(listener);
}

/**
 * Remove a closed SSE stream's listener. The cleanup that calls this runs from
 * a socket "close" handler, outside any request, so a rejection (Redis slow or
 * down) is logged here rather than left unhandled.
 */
export async function unsubscribeStream(channel: string, listener: Listener) {
  const entry = channels.get(channel);
  if (!entry) return;
  entry.listeners.delete(listener);
  if (entry.listeners.size > 0) return;
  channels.delete(channel);

  try {
    await redis.unsubscribe(channel);
  } catch (error) {
    logger.error({ err: error, channel }, "Failed to unsubscribe SSE stream");
    Sentry.captureException(error, { extra: { channel } });
  }
}
