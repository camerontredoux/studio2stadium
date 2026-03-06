import redis from "@adonisjs/redis/services/main";

const SESSION_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Invalidates all sessions for a user by bumping their version.
 * This forces them to re-authenticate on their next request.
 */
export async function invalidateUserSessions(userId: string): Promise<void> {
  const connection = redis.connection("session");
  const version = Date.now();
  await connection.setex(`version:${userId}`, SESSION_AGE, version);
}
