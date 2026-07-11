import { test } from "@japa/runner";
import { sendThrottledEmails } from "./throttled-email-sender.ts";

test.group("sendThrottledEmails", () => {
  test("sends sequentially with pacing between recipients", async ({
    assert,
  }) => {
    const events: string[] = [];

    const result = await sendThrottledEmails(
      [
        {
          recipient: "first@example.com",
          send: async () => {
            events.push("send:first");
          },
        },
        {
          recipient: "second@example.com",
          send: async () => {
            events.push("send:second");
          },
        },
        {
          recipient: "third@example.com",
          send: async () => {
            events.push("send:third");
          },
        },
      ],
      {
        pacingMs: 100,
        sleep: async (milliseconds) => {
          events.push(`sleep:${milliseconds}`);
        },
      }
    );

    assert.deepEqual(events, [
      "send:first",
      "sleep:100",
      "send:second",
      "sleep:100",
      "send:third",
    ]);
    assert.deepEqual(result, { sent: 3, failed: 0 });
  });

  test("retries SES throttling errors with exponential backoff", async ({
    assert,
  }) => {
    let attempts = 0;
    const delays: number[] = [];

    const result = await sendThrottledEmails(
      [
        {
          recipient: "retry@example.com",
          send: async () => {
            attempts += 1;
            if (attempts < 3) {
              const error = new Error("Rate exceeded");
              error.name = "Throttling";
              throw error;
            }
          },
        },
      ],
      {
        pacingMs: 0,
        retryBackoffMs: 250,
        sleep: async (milliseconds) => {
          delays.push(milliseconds);
        },
      }
    );

    assert.equal(attempts, 3);
    assert.deepEqual(delays, [250, 500]);
    assert.deepEqual(result, { sent: 1, failed: 0 });
  });

  test("does not retry terminal errors and collects the failure", async ({
    assert,
  }) => {
    const terminalError = new Error("Mailbox rejected");
    const failures: Array<{ recipient: string; error: unknown }> = [];
    let failedAttempts = 0;

    const result = await sendThrottledEmails(
      [
        {
          recipient: "failed@example.com",
          send: async () => {
            failedAttempts += 1;
            throw terminalError;
          },
        },
        {
          recipient: "sent@example.com",
          send: async () => {},
        },
      ],
      {
        pacingMs: 0,
        sleep: async () => {},
        onTerminalFailure: (task, error) => {
          failures.push({ recipient: task.recipient, error });
        },
      }
    );

    assert.equal(failedAttempts, 1);
    assert.deepEqual(failures, [
      { recipient: "failed@example.com", error: terminalError },
    ]);
    assert.deepEqual(result, { sent: 1, failed: 1 });
  });

  test("collects throttling failures after retries are exhausted", async ({
    assert,
  }) => {
    let attempts = 0;
    const recipients: string[] = [];

    const result = await sendThrottledEmails(
      [
        {
          recipient: "throttled@example.com",
          send: async () => {
            attempts += 1;
            throw Object.assign(new Error("Too many requests"), {
              name: "TooManyRequestsException",
            });
          },
        },
      ],
      {
        pacingMs: 0,
        maxRetries: 2,
        sleep: async () => {},
        onTerminalFailure: (task) => {
          recipients.push(task.recipient);
        },
      }
    );

    assert.equal(attempts, 3);
    assert.deepEqual(recipients, ["throttled@example.com"]);
    assert.deepEqual(result, { sent: 0, failed: 1 });
  });
});
