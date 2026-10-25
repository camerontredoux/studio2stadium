import { formatClock } from "@/features/org/lib/event-clock";

/**
 * The shape of a check-in pass code, mirrored from the backend's
 * `check-in-code.ts`: a fixed prefix and 48 bytes as base64url. Only a cheap
 * filter so random QR codes never reach the API; the server decides.
 */
const CHECK_IN_CODE = /^S2SCI1\.[A-Za-z0-9_-]{64}$/;

export function looksLikeCheckInCode(text: string): boolean {
  return CHECK_IN_CODE.test(text.trim());
}

/** What a failed scan means to the person holding the scanner. */
export type ScanFailure =
  | "unrecognized"
  | "wrong-event"
  | "not-on-roster"
  | "failed";

const FAILURE_BY_CODE: Record<string, ScanFailure> = {
  E_CHECK_IN_CODE_INVALID: "unrecognized",
  E_VALIDATION_ERROR: "unrecognized",
  E_CHECK_IN_CODE_WRONG_EVENT: "wrong-event",
  E_CHECK_IN_ROSTER_NOT_FOUND: "not-on-roster",
};

/** Maps the API's `{ code }` error body to a scan result; anything else is a failed request. */
export function scanFailure(error: unknown): ScanFailure {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code: unknown }).code
      : undefined;
  return (typeof code === "string" && FAILURE_BY_CODE[code]) || "failed";
}

/** "09:48": a check-in time in 24-hour time on the event's clock (`timeZone`; the viewer's without one). */
export function formatCheckInTime(
  iso: string | null | undefined,
  timeZone?: string | null,
): string {
  return formatClock(iso, timeZone);
}
