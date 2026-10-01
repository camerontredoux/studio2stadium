import { spendHashedToken } from "#modules/auth/password-tokens";
import redis from "@adonisjs/redis/services/main";
import { hash, randomBytes } from "node:crypto";

/**
 * The single-use link that lets the owner of an inbox claim an Org bought for
 * an account nobody had proved they own (ADR 0007). The same pattern as the
 * password links: only the token's SHA-256 is kept, in Redis, under its own
 * prefix, so it can never be spent as a password token and a password request
 * neither replaces nor shortens it.
 *
 * One per user, covering every claim that user has pending: a second purchase
 * before the first claim replaces the token, and the newest link claims both.
 * It lives a week, like the set-password link it sits beside in the email.
 */
export const CLAIM_TOKEN = {
  prefix: "claim-org",
  ttlSeconds: 7 * 24 * 60 * 60,
} as const;

export function claimTokenKey(userId: string) {
  return `${CLAIM_TOKEN.prefix}:${userId}`;
}

/** A new claim token for this user, replacing any they had. */
export async function mintClaimToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");

  await redis.setex(
    claimTokenKey(userId),
    CLAIM_TOKEN.ttlSeconds,
    hash("sha256", token)
  );

  return token;
}

/**
 * Whether this is the user's pending claim token, without spending it.
 * `missing` when they have none (expired, spent, or never issued).
 */
export async function checkClaimToken(
  userId: string,
  token: string
): Promise<"valid" | "invalid" | "missing"> {
  const stored = await redis.get(claimTokenKey(userId));
  if (!stored) return "missing";
  return stored === hash("sha256", token) ? "valid" : "invalid";
}

/** Spend the token, if it is still this one, so the link works once. */
export async function spendClaimToken(userId: string, token: string) {
  await spendHashedToken(claimTokenKey(userId), hash("sha256", token));
}
