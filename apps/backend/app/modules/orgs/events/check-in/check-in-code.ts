import { createHmac, timingSafeEqual } from "node:crypto";
import env from "#start/env";

/**
 * The text a Dancer's check-in pass QR encodes: the Roster Entry id and the
 * Org Event id, signed with APP_KEY.
 *
 *   S2SCI1.<base64url(roster uuid 16 bytes + event uuid 16 bytes + mac 16 bytes)>
 *
 * 71 characters, so the QR stays a small version that reads off a phone
 * screen. AdonisJS's message verifier wraps the payload in JSON with a purpose
 * and comes out near 200 characters, hence a hand-rolled HMAC.
 *
 * It deliberately never expires: a pass shown at the door has to keep working
 * for the whole event, and it is scoped to one event and one Roster Entry, so
 * removing the entry (or the event ending) is what retires it.
 */
export const CHECK_IN_CODE_PREFIX = "S2SCI1.";

const PURPOSE = "org-event-check-in";
const UUID_BYTES = 16;
const MAC_BYTES = 16;
const PAYLOAD_BYTES = UUID_BYTES * 2 + MAC_BYTES;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuidToBytes(uuid: string): Buffer {
  if (!UUID_RE.test(uuid)) throw new Error(`Not a UUID: ${uuid}`);
  return Buffer.from(uuid.replaceAll("-", ""), "hex");
}

function bytesToUuid(bytes: Buffer): string {
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function mac(ids: Buffer): Buffer {
  return createHmac("sha256", env.get("APP_KEY"))
    .update(PURPOSE)
    .update(ids)
    .digest()
    .subarray(0, MAC_BYTES);
}

export function signCheckInCode(rosterId: string, eventId: string): string {
  const ids = Buffer.concat([uuidToBytes(rosterId), uuidToBytes(eventId)]);
  return (
    CHECK_IN_CODE_PREFIX + Buffer.concat([ids, mac(ids)]).toString("base64url")
  );
}

/** The ids a code carries, or null when it is not one of ours or was tampered with. */
export function verifyCheckInCode(
  code: string
): { rosterId: string; eventId: string } | null {
  if (!code.startsWith(CHECK_IN_CODE_PREFIX)) return null;
  const body = code.slice(CHECK_IN_CODE_PREFIX.length);
  if (!/^[A-Za-z0-9_-]+$/.test(body)) return null;

  const bytes = Buffer.from(body, "base64url");
  if (bytes.length !== PAYLOAD_BYTES) return null;

  const ids = bytes.subarray(0, UUID_BYTES * 2);
  if (!timingSafeEqual(bytes.subarray(UUID_BYTES * 2), mac(ids))) return null;

  return {
    rosterId: bytesToUuid(ids.subarray(0, UUID_BYTES)),
    eventId: bytesToUuid(ids.subarray(UUID_BYTES)),
  };
}
