import redisConfig from "#config/redis";
import { getUserChannel } from "#shared/realtime/pubsub";
import { test } from "@japa/runner";
import {
  keyPrefixOption,
  normalizeRedisKeyPrefix,
  redisKeyPrefix,
  withRedisKeyPrefix,
} from "./key-prefix.ts";

test.group("normalizeRedisKeyPrefix", () => {
  test("unset or blank means no prefix", ({ assert }) => {
    assert.equal(normalizeRedisKeyPrefix(undefined), "");
    assert.equal(normalizeRedisKeyPrefix(""), "");
    assert.equal(normalizeRedisKeyPrefix("   "), "");
  });

  test("appends a trailing colon when missing", ({ assert }) => {
    assert.equal(normalizeRedisKeyPrefix("staging"), "staging:");
    assert.equal(normalizeRedisKeyPrefix("staging:"), "staging:");
    assert.equal(normalizeRedisKeyPrefix(" staging "), "staging:");
  });
});

test.group("keyPrefixOption", () => {
  test("prefix is applied to both connections", ({ assert }) => {
    assert.deepEqual(keyPrefixOption("staging:", "session:"), {
      keyPrefix: "staging:session:",
    });
    assert.deepEqual(keyPrefixOption("staging:"), { keyPrefix: "staging:" });
  });

  test("no prefix leaves the options as they were", ({ assert }) => {
    assert.deepEqual(keyPrefixOption("", "session:"), {
      keyPrefix: "session:",
    });
    assert.deepEqual(keyPrefixOption(""), {});
    assert.notProperty(keyPrefixOption(""), "keyPrefix");
  });
});

test.group("withRedisKeyPrefix", () => {
  test("prefixes names ioredis does not (channels, SCAN patterns)", ({
    assert,
  }) => {
    assert.equal(
      withRedisKeyPrefix("realtime:user:1", "staging:"),
      "staging:realtime:user:1"
    );
    assert.equal(withRedisKeyPrefix("realtime:user:1", ""), "realtime:user:1");
  });
});

test.group("redis config", () => {
  test("connections carry REDIS_KEY_PREFIX, and only when it is set", ({
    assert,
  }) => {
    assert.equal(
      redisConfig.connections.session.keyPrefix,
      `${redisKeyPrefix}session:`
    );
    if (redisKeyPrefix) {
      assert.equal(redisConfig.connections.cache.keyPrefix, redisKeyPrefix);
    } else {
      // Unset: identical to the config before REDIS_KEY_PREFIX existed.
      assert.equal(redisConfig.connections.session.keyPrefix, "session:");
      assert.notProperty(redisConfig.connections.cache, "keyPrefix");
    }
    assert.equal(getUserChannel("abc"), `${redisKeyPrefix}realtime:user:abc`);
  });
});
