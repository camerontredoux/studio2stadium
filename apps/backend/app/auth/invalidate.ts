import redis from "@adonisjs/redis/services/main";

const SESSION_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Invalidates all sessions for a user by bumping their version.
 * This forces them to re-authenticate on their next request.
 *
 * "Re-authenticate" means the guard reloads the user from the database and
 * keeps the session: this refreshes stale session data, it does not sign
 * anyone out. To end every session a user has, use `revokeUserSessions`.
 */
export async function invalidateUserSessions(userId: string): Promise<void> {
  const connection = redis.connection("session");
  const version = Date.now();
  await connection.setex(`version:${userId}`, SESSION_AGE, version);
}

/** The key that holds when a user's sessions were last revoked. */
export function revokedSessionsKey(userId: string) {
  return `revoked:${userId}`;
}

/**
 * Ends every session the user has now, on every device, bearer tokens
 * included. The guard refuses and deletes any session that was started at or
 * before this moment, so the user must sign in again.
 *
 * Sessions are keyed by a random id with no index by user, so this records a
 * cut-off instead of deleting them one by one. The cut-off lives as long as a
 * session can go unused: a session idle for longer has already expired.
 *
 * GET requests that the short-lived cache cookie answers do not reach Redis,
 * so a revoked browser can still read for at most `cacheCookieAge`.
 */
export async function revokeUserSessions(userId: string): Promise<void> {
  const connection = redis.connection("session");
  await connection.setex(revokedSessionsKey(userId), SESSION_AGE, Date.now());
}
