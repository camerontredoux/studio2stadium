import redis from "@adonisjs/redis/services/main";

/**
 * Transmit keeps each SSE stream, and the channels it is subscribed to, in the
 * memory of the machine that opened it. Fly runs two or more machines and
 * routes every request on its own, so `__transmit/subscribe` often lands on a
 * machine that has never seen the uid and answers 400. Each machine records
 * the streams it holds here, and the subscribe routes send a stray request to
 * the owner with Fly's `fly-replay` header.
 */

// Outlives any stream we expect; the key is deleted when the stream closes.
const OWNER_TTL_SECONDS = 60 * 60 * 24;

const localStreams = new Set<string>();

export function streamOwnerKey(uid: string) {
  return `transmit:stream-owner:${uid}`;
}

/**
 * Records that this machine holds the stream for `uid`. Without a machine id
 * (one process, outside Fly) there is nowhere else to route to.
 */
export async function claimStream(uid: string, machineId: string | undefined) {
  localStreams.add(uid);
  if (!machineId) return;
  await redis
    .connection("cache")
    .set(streamOwnerKey(uid), machineId, "EX", OWNER_TTL_SECONDS);
}

export async function releaseStream(
  uid: string,
  machineId: string | undefined
) {
  localStreams.delete(uid);
  if (!machineId) return;
  const connection = redis.connection("cache");
  // A client that reconnected with the same uid may now be held elsewhere.
  if ((await connection.get(streamOwnerKey(uid))) === machineId) {
    await connection.del(streamOwnerKey(uid));
  }
}

/**
 * The machine to replay a subscribe or unsubscribe for `uid` on, or null when
 * this machine should answer it itself.
 */
export async function replayTarget(
  uid: string,
  machineId: string | undefined
): Promise<string | null> {
  if (localStreams.has(uid)) return null;
  const owner = await redis.connection("cache").get(streamOwnerKey(uid));
  if (!owner || owner === machineId) return null;
  return owner;
}
