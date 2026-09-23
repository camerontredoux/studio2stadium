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

export type ConsumeResult = "consumed" | "missing" | "invalid";

/**
 * Spend a token from either purpose. `missing` when the user has no pending
 * token at all (expired or never issued), `invalid` when one is pending but
 * this is not it. A consumed token is deleted, so a link works once.
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
    const key = passwordTokenKey(purpose, userId);
    const stored = await redis.get(key);
    if (!stored) continue;

    pending = true;
    if (stored === hashed) {
      await redis.del(key);
      return "consumed";
    }
  }

  return pending ? "invalid" : "missing";
}
