import { createHmac } from "node:crypto";
import env from "#start/env";

const TTL_MS = 5 * 60 * 1000; // 5 minutes

function secret(): string {
  return env.get("APP_KEY");
}

/** Mint a preview token encoding eventId + kind + expiry. */
export function mintPreviewToken(eventId: string, kind: string): string {
  const expiresAt = Date.now() + TTL_MS;
  const payload = `${eventId}:${kind}:${expiresAt}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export type TokenVerifyResult =
  | { ok: true }
  | { ok: false; reason: "expired" | "invalid" };

/** Verify a preview token against eventId + kind. */
export function verifyPreviewToken(
  token: string,
  eventId: string,
  kind: string
): TokenVerifyResult {
  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return { ok: false, reason: "invalid" };
  }

  const parts = decoded.split(":");
  if (parts.length !== 4) return { ok: false, reason: "invalid" };

  const [tEventId, tKind, tExpiry, tSig] = parts as [
    string,
    string,
    string,
    string,
  ];
  const payload = `${tEventId}:${tKind}:${tExpiry}`;
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");

  if (tSig !== expected) return { ok: false, reason: "invalid" };
  if (tEventId !== eventId || tKind !== kind)
    return { ok: false, reason: "invalid" };
  if (Date.now() > Number(tExpiry)) return { ok: false, reason: "expired" };

  return { ok: true };
}
