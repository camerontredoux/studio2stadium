import encryption from "@adonisjs/core/services/encryption";

/**
 * Namespacing string. An encrypted value produced for a different purpose will
 * not decrypt here, so an unsubscribe link cannot be replayed against another
 * feature that also encrypts user ids.
 */
const PURPOSE = "prospect-email-unsubscribe";

/** One recruiting cycle plus margin, so links in a September email still work in January. */
const TTL = "1y";

export function signUnsubscribeToken(userId: string): string {
  return encryption.encrypt(userId, TTL, PURPOSE);
}

/**
 * Returns the user id, or null when the token is forged, expired, or was
 * encrypted for a different purpose.
 *
 * The old stack put the bare `users.id` in the unsubscribe URL, so anyone who
 * guessed a UUID could unsubscribe that user.
 */
export function verifyUnsubscribeToken(token: string): string | null {
  return encryption.decrypt<string>(token, PURPOSE);
}

/**
 * Build the unsubscribe link.
 *
 * `apiUrl` must be the **backend's** public base URL (`API_URL`), not
 * `SITE_URL`. The unsubscribe route is registered on this AdonisJS app, and
 * `start/routes.ts` applies no global `/api` prefix. `SITE_URL` points at the
 * frontend, which has no such route — sending mailbox providers there would
 * 404 their RFC 8058 one-click POST and silently break unsubscribe, the same
 * way the retired Lambdas silently 404'd against the apex domain.
 */
export function unsubscribeUrl(apiUrl: string, userId: string): string {
  const base = apiUrl.replace(/\/$/, "");
  const token = encodeURIComponent(signUnsubscribeToken(userId));
  return `${base}/unsubscribe?token=${token}`;
}
