import logger from "@adonisjs/core/services/logger";
import redis from "@adonisjs/redis/services/main";
import { test } from "@japa/runner";
import { unsubscribeStream } from "./unsubscribe.ts";

test.group("SSE stream unsubscribe", (group) => {
  const unhandled: unknown[] = [];
  const logged: unknown[][] = [];
  const onUnhandled = (reason: unknown) => unhandled.push(reason);

  group.each.setup(() => {
    unhandled.length = 0;
    logged.length = 0;
    const unsubscribe = redis.unsubscribe;
    const error = logger.error;
    redis.unsubscribe = (async () => {
      throw new Error("Command timed out");
    }) as typeof redis.unsubscribe;
    logger.error = ((...args: unknown[]) => {
      logged.push(args);
    }) as typeof logger.error;
    process.on("unhandledRejection", onUnhandled);

    return () => {
      redis.unsubscribe = unsubscribe;
      logger.error = error;
      process.off("unhandledRejection", onUnhandled);
    };
  });

  test("a failed unsubscribe from a close handler is logged, not an unhandled rejection", async ({
    assert,
  }) => {
    void unsubscribeStream("user:1");
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.lengthOf(unhandled, 0);
    assert.lengthOf(logged, 1);
    const [context, message] = logged[0] as [
      { channel: string; err: Error },
      string,
    ];
    assert.equal(message, "Failed to unsubscribe SSE stream");
    assert.equal(context.channel, "user:1");
    assert.equal(context.err.message, "Command timed out");
  });
});
