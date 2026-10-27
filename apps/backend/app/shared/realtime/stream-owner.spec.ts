import redis from "@adonisjs/redis/services/main";
import { test } from "@japa/runner";
import { randomUUID } from "node:crypto";
import {
  claimStream,
  releaseStream,
  replayTarget,
  streamOwnerKey,
} from "./stream-owner.ts";

test.group("stream owner", (group) => {
  let uid: string;
  group.each.setup(() => {
    uid = randomUUID();
    return async () => {
      await redis.connection("cache").del(streamOwnerKey(uid));
    };
  });

  test("another machine replays to the machine that claimed the stream", async ({
    assert,
  }) => {
    await redis.connection("cache").set(streamOwnerKey(uid), "machine-a");
    assert.equal(await replayTarget(uid, "machine-b"), "machine-a");
    assert.isNull(await replayTarget(uid, "machine-a"));
  });

  test("the machine holding the stream answers itself", async ({ assert }) => {
    await claimStream(uid, "machine-a");
    assert.isNull(await replayTarget(uid, "machine-a"));
    assert.equal(
      await redis.connection("cache").get(streamOwnerKey(uid)),
      "machine-a"
    );
    await releaseStream(uid, "machine-a");
    assert.isNull(await redis.connection("cache").get(streamOwnerKey(uid)));
  });

  test("closing a stream keeps the claim of a machine that took it over", async ({
    assert,
  }) => {
    await claimStream(uid, "machine-a");
    await redis.connection("cache").set(streamOwnerKey(uid), "machine-b");
    await releaseStream(uid, "machine-a");
    assert.equal(await replayTarget(uid, "machine-a"), "machine-b");
  });

  test("an unknown uid is answered where it lands", async ({ assert }) => {
    assert.isNull(await replayTarget(uid, "machine-a"));
  });
});
