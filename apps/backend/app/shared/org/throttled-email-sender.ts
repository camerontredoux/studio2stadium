import logger from "@adonisjs/core/services/logger";
import { setTimeout as sleep } from "node:timers/promises";

export const EMAIL_SEND_PACING_MS = 100;
export const EMAIL_SEND_MAX_RETRIES = 2;
export const EMAIL_SEND_RETRY_BACKOFF_MS = 250;

export interface EmailSendTask {
  recipient: string;
  send: () => Promise<void>;
}

export interface ThrottledEmailResult {
  sent: number;
  failed: number;
}

interface ThrottledEmailOptions {
  pacingMs?: number;
  maxRetries?: number;
  retryBackoffMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
  onTerminalFailure?: (task: EmailSendTask, error: unknown) => void;
}

function errorProperty(error: unknown, property: string): unknown {
  if (typeof error !== "object" || error === null) return undefined;
  return Reflect.get(error, property);
}

export function isSesThrottlingError(error: unknown): boolean {
  let current: unknown = error;

  for (let depth = 0; current && depth < 4; depth += 1) {
    const name = errorProperty(current, "name");
    const code = errorProperty(current, "code");
    const message = errorProperty(current, "message");
    const metadata = errorProperty(current, "$metadata");
    const statusCode = errorProperty(metadata, "httpStatusCode");
    const searchable = [name, code, message]
      .filter((value): value is string => typeof value === "string")
      .join(" ");

    if (
      statusCode === 429 ||
      /throttl|too\s*many\s*requests|TooManyRequestsException/i.test(searchable)
    ) {
      return true;
    }

    current = errorProperty(current, "cause");
  }

  return false;
}

export async function sendThrottledEmails(
  tasks: readonly EmailSendTask[],
  {
    pacingMs = EMAIL_SEND_PACING_MS,
    maxRetries = EMAIL_SEND_MAX_RETRIES,
    retryBackoffMs = EMAIL_SEND_RETRY_BACKOFF_MS,
    sleep: wait = sleep,
    onTerminalFailure,
  }: ThrottledEmailOptions = {}
): Promise<ThrottledEmailResult> {
  let sent = 0;
  let failed = 0;

  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index]!;
    let retryCount = 0;

    while (true) {
      try {
        await task.send();
        sent += 1;
        break;
      } catch (error) {
        if (isSesThrottlingError(error) && retryCount < maxRetries) {
          await wait(retryBackoffMs * 2 ** retryCount);
          retryCount += 1;
          continue;
        }

        failed += 1;
        logger.error(
          { recipient: task.recipient, err: error },
          "Email send failed after retries"
        );
        onTerminalFailure?.(task, error);
        break;
      }
    }

    if (pacingMs > 0 && index < tasks.length - 1) {
      await wait(pacingMs);
    }
  }

  return { sent, failed };
}
