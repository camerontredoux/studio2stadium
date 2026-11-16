import env from "#start/env";

/**
 * Send-time check of one recipient against Sender, the marketing list whose
 * unsubscribes, bounces and spam reports the app must honor. One read-only
 * GET per send attempt (https://api.sender.net/subscribers/get-one/); it
 * never adds, updates or re-subscribes anyone in Sender, and nothing is
 * cached, so every attempt asks again.
 *
 * - an active subscriber passes on to the app's own checks;
 * - any other Sender status (unsubscribed, bounced, spam_reported, ...)
 *   suppresses the email;
 * - a 404 from Sender's API means Sender has never heard of the address,
 *   which is normal for a new purchaser, so the app's own consent decides;
 * - anything else (no token, 401, 403, 429, 5xx, a timeout, a network
 *   error, an unexpected body, a 404 that is not from the API) is not an
 *   answer: the caller must not send, and retries later.
 *
 * Used by the Week Pass emails only. The internal sample command does not
 * call it: samples go to one configured internal mailbox, not a customer.
 */

export const SENDER_API_BASE = "https://api.sender.net/v2";
export const SENDER_TIMEOUT_MS = 5_000;

export type SenderDecision =
  | { allow: true; reason: "sender_active" | "not_in_sender" }
  | { allow: false; reason: `sender_${string}` };

/** Sender gave no usable answer. Never carries the token or the address. */
export class SenderCheckUnavailable extends Error {
  constructor(detail: string) {
    super(`Sender check unavailable: ${detail}`);
    this.name = "SenderCheckUnavailable";
  }
}

export type SenderCheck = (email: string) => Promise<SenderDecision>;

interface Options {
  token?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJson(response: Response) {
  return /^application\/(.+\+)?json\b/i.test(
    response.headers.get("content-type") ?? ""
  );
}

export async function checkSenderSubscriber(
  email: string,
  options: Options = {}
): Promise<SenderDecision> {
  const token = (options.token ?? env.get("SENDER_API_TOKEN"))?.trim();
  if (!token) throw new SenderCheckUnavailable("SENDER_API_TOKEN is not set");

  const doFetch = options.fetch ?? fetch;
  let response: Response;
  try {
    response = await doFetch(
      `${SENDER_API_BASE}/subscribers/${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        redirect: "error",
        signal: AbortSignal.timeout(options.timeoutMs ?? SENDER_TIMEOUT_MS),
      }
    );
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    throw new SenderCheckUnavailable(timedOut ? "timed out" : "network error");
  }

  if (response.status === 404) {
    // Only Sender's API answering "no such subscriber" counts; an HTML 404
    // from something in between does not.
    if (isJson(response)) return { allow: true, reason: "not_in_sender" };
    throw new SenderCheckUnavailable("404 that did not come from the API");
  }
  if (response.status !== 200) {
    throw new SenderCheckUnavailable(`HTTP ${response.status}`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new SenderCheckUnavailable("response was not JSON");
  }
  const data = isObject(body) ? body.data : undefined;
  if (
    !isObject(data) ||
    typeof data.email !== "string" ||
    !isObject(data.status) ||
    typeof data.status.email !== "string" ||
    data.status.email.trim() === ""
  ) {
    throw new SenderCheckUnavailable("unexpected response shape");
  }
  if (data.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
    throw new SenderCheckUnavailable("response was for a different address");
  }

  const status = data.status.email.trim().toLowerCase();
  if (status === "active") return { allow: true, reason: "sender_active" };
  return {
    allow: false,
    reason: `sender_${status.replace(/[^a-z0-9_]/g, "_").slice(0, 40)}`,
  };
}
