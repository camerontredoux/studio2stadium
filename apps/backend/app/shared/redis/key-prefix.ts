import env from "#start/env";

/**
 * Normalise a raw REDIS_KEY_PREFIX value. Blank or unset yields "" (no
 * prefix). A non-empty value always ends in ":" so "staging" and "staging:"
 * produce the same keys.
 */
export function normalizeRedisKeyPrefix(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return "";
  return trimmed.endsWith(":") ? trimmed : `${trimmed}:`;
}

/**
 * Namespace for every Redis key and pub/sub channel this process uses. It is
 * "" unless REDIS_KEY_PREFIX is set (staging shares prod's Redis).
 *
 * ioredis `keyPrefix` covers keyed commands on our connections. It does NOT
 * cover pub/sub channel names or KEYS/SCAN patterns, so code that builds those
 * must add this prefix itself (see `withRedisKeyPrefix`).
 */
export const redisKeyPrefix = normalizeRedisKeyPrefix(
  env.get("REDIS_KEY_PREFIX")
);

/**
 * Prepend the process-wide prefix to a name that ioredis does not prefix for
 * us (pub/sub channels, SCAN/KEYS match patterns).
 */
export function withRedisKeyPrefix(
  name: string,
  prefix: string = redisKeyPrefix
): string {
  return `${prefix}${name}`;
}

/**
 * ioredis `keyPrefix` option for a connection: `prefix` + `base`. Returns an
 * empty object when both are empty so an unprefixed connection's options are
 * exactly what they were before REDIS_KEY_PREFIX existed.
 */
export function keyPrefixOption(
  prefix: string,
  base: string = ""
): { keyPrefix?: string } {
  const keyPrefix = `${prefix}${base}`;
  return keyPrefix ? { keyPrefix } : {};
}
