import logger from "@adonisjs/core/services/logger";
import mail from "@adonisjs/mail/services/main";
import { test } from "@japa/runner";
import { SubscriptionDeletedEvent } from "./event.ts";

test.group("Subscription ended email listener", (group) => {
  const unhandled: unknown[] = [];
  const logged: unknown[][] = [];
  const onUnhandled = (reason: unknown) => unhandled.push(reason);

  group.each.setup(() => {
    unhandled.length = 0;
    logged.length = 0;
    const send = mail.send;
    const error = logger.error;
    mail.send = (async () => {
      throw new Error("SES is down");
    }) as typeof mail.send;
    logger.error = ((...args: unknown[]) => {
      logged.push(args);
    }) as typeof logger.error;
    process.on("unhandledRejection", onUnhandled);

    return () => {
      mail.send = send;
      logger.error = error;
      process.off("unhandledRejection", onUnhandled);
    };
  });

  test("a failed send resolves the listener and logs the error", async ({
    assert,
  }) => {
    await SubscriptionDeletedEvent.dispatch({
      email: "a@example.com",
      name: "Ada",
    });

    assert.lengthOf(logged, 1);
    const [context, message] = logged[0] as [
      { listener: string; err: Error },
      string,
    ];
    assert.equal(message, "Event listener failed");
    assert.equal(context.listener, "SubscriptionDeletedHandler");
    assert.equal(context.err.message, "SES is down");
  });

  test("a failed send from an unawaited dispatch is not an unhandled rejection", async ({
    assert,
  }) => {
    void SubscriptionDeletedEvent.dispatch({
      email: "a@example.com",
      name: "Ada",
    });
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.lengthOf(unhandled, 0);
    assert.lengthOf(logged, 1);
  });
});
