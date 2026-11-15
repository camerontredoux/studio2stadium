import logger from "@adonisjs/core/services/logger";
import redis from "@adonisjs/redis/services/main";
import { test } from "@japa/runner";
import { subscribeStream, unsubscribeStream } from "./subscription.ts";

const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

test.group("SSE stream subscription", () => {
  test("closing one of two streams keeps the other receiving; closing both releases the channel", async ({
    assert,
  }) => {
    const channel = `test:sse:${Date.now()}`;
    const first: string[] = [];
    const second: string[] = [];
    const onFirst = (message: string) => first.push(message);
    const onSecond = (message: string) => second.push(message);

    subscribeStream(channel, onFirst);
    subscribeStream(channel, onSecond);
    await settle();

    await redis.publish(channel, "a");
    await settle();
    assert.deepEqual(first, ["a"]);
    assert.deepEqual(second, ["a"]);

    await unsubscribeStream(channel, onFirst);
    const stillSubscribed = (await redis.call("PUBSUB", "NUMSUB", channel)) as [
      string,
      number,
    ];
    assert.equal(stillSubscribed[1], 1);

    await redis.publish(channel, "b");
    await settle();
    assert.deepEqual(first, ["a"]);
    assert.deepEqual(second, ["a", "b"]);

    await unsubscribeStream(channel, onSecond);
    const released = (await redis.call("PUBSUB", "NUMSUB", channel)) as [
      string,
      number,
    ];
    assert.equal(released[1], 0);
  });

  test("a stream opened while the last one's unsubscribe is in flight still receives", async ({
    assert,
  }) => {
    const channel = `test:sse:race:${Date.now()}`;
    const received: string[] = [];
    const onOld = () => {};
    const onNew = (message: string) => received.push(message);

    subscribeStream(channel, onOld);
    await settle();

    const pending = unsubscribeStream(channel, onOld);
    subscribeStream(channel, onNew);
    await pending;
    await settle();

    await redis.publish(channel, "c");
    await settle();
    assert.deepEqual(received, ["c"]);

    await unsubscribeStream(channel, onNew);
  });
});

test.group("SSE stream unsubscribe failure", (group) => {
  const unhandled: unknown[] = [];
  const logged: unknown[][] = [];
  const onUnhandled = (reason: unknown) => unhandled.push(reason);

  group.each.setup(() => {
    unhandled.length = 0;
    logged.length = 0;
    const subscribe = redis.subscribe;
    const unsubscribe = redis.unsubscribe;
    const error = logger.error;
    redis.subscribe = (() => {}) as typeof redis.subscribe;
    redis.unsubscribe = (async () => {
      throw new Error("Command timed out");
    }) as typeof redis.unsubscribe;
    logger.error = ((...args: unknown[]) => {
      logged.push(args);
    }) as typeof logger.error;
    process.on("unhandledRejection", onUnhandled);

    return () => {
      redis.subscribe = subscribe;
      redis.unsubscribe = unsubscribe;
      logger.error = error;
      process.off("unhandledRejection", onUnhandled);
    };
  });

  test("a failed unsubscribe from a close handler is logged, not an unhandled rejection", async ({
    assert,
  }) => {
    const listener = () => {};
    subscribeStream("user:1", listener);
    void unsubscribeStream("user:1", listener);
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
