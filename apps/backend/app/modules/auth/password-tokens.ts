import redis from "@adonisjs/redis/services/main";
import { hash, randomBytes } from "node:crypto";

/**
 * Why someone is being handed a link that sets their password.
 *
 * - `reset`: they asked (forgot password). Short-lived, because the request
 *   came from whoever typed the address a moment ago.
 * - `setup`: an account was created for them and has no password yet — an
 *   Organizer whose Event Tier purchase created it (ADR 0007). It arrives in a
 *   "your Org is ready" email they may not open the same day, so it lives for
 *   a week.
 *
 * Each purpose has its own key, so asking for a reset neither replaces nor
 * shortens a pending set-password link, and both land on the same reset page.
 */
export const PASSWORD_TOKEN_PURPOSES = {
  reset: { prefix: "forgot-password", ttlSeconds: 15 * 60 },
  setup: { prefix: "set-password", ttlSeconds: 7 * 24 * 60 * 60 },
} as const;

export type PasswordTokenPurpose = keyof typeof PASSWORD_TOKEN_PURPOSES;

export function passwordTokenKey(
  purpose: PasswordTokenPurpose,
  userId: string
) {
  return `${PASSWORD_TOKEN_PURPOSES[purpose].prefix}:${userId}`;
}

/**
 * A new single-use token for this user and purpose. Only its SHA-256 is
 * stored; the token itself goes into the emailed link and nowhere else.
 */
export async function mintPasswordToken(
  purpose: PasswordTokenPurpose,
  userId: string
): Promise<string> {
  const token = randomBytes(32).toString("hex");

  await redis.setex(
    passwordTokenKey(purpose, userId),
    PASSWORD_TOKEN_PURPOSES[purpose].ttlSeconds,
    hash("sha256", token)
  );

  return token;
}

/** Whether this user has an unspent, unexpired token for this purpose. */
export async function hasPendingPasswordToken(
  purpose: PasswordTokenPurpose,
  userId: string
): Promise<boolean> {
  return (await redis.exists(passwordTokenKey(purpose, userId))) === 1;
}

/**
 * Delete every pending token this user has, of every purpose, so no link
 * already sent can set their password.
 */
export async function revokePasswordTokens(userId: string): Promise<void> {
  await redis.del(
    ...(Object.keys(PASSWORD_TOKEN_PURPOSES) as PasswordTokenPurpose[]).map(
      (purpose) => passwordTokenKey(purpose, userId)
    )
  );
}

export type ConsumeResult =
  | { outcome: "consumed"; purpose: PasswordTokenPurpose }
  | { outcome: "missing" | "invalid" };

/**
 * Deletes the key only when it holds this hash, in one step on the Redis
 * server. A separate GET and DEL would let two requests with the same link
 * both see the match and both set a password.
 *
 * Returns 1 when it deleted the key, 0 when the key holds another hash, and
 * -1 when there is no key.
 */
const CONSUME_IF_MATCHES = `
local stored = redis.call("GET", KEYS[1])
if not stored then return -1 end
if stored == ARGV[1] then
  redis.call("DEL", KEYS[1])
  return 1
end
return 0
`;

/**
 * Spend a token from either purpose. `missing` when the user has no pending
 * token at all (expired or never issued), `invalid` when one is pending but
 * this is not it. A consumed token is deleted atomically, so a link works
 * once even when it is submitted twice at the same time. A consumed result
 * says which purpose the token was for.
 */
export async function consumePasswordToken(
  userId: string,
  token: string
): Promise<ConsumeResult> {
  const hashed = hash("sha256", token);
  let pending = false;

  for (const purpose of Object.keys(
    PASSWORD_TOKEN_PURPOSES
  ) as PasswordTokenPurpose[]) {
    const result = await redis.eval(
      CONSUME_IF_MATCHES,
      1,
      passwordTokenKey(purpose, userId),
      hashed
    );

    if (result === 1) return { outcome: "consumed", purpose };
    if (result === 0) pending = true;
  }

  return { outcome: pending ? "invalid" : "missing" };
}
