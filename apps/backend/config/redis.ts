import env from "#start/env";
import { defineConfig } from "@adonisjs/redis";
import { type InferConnections } from "@adonisjs/redis/types";

const redisConfig = defineConfig({
  connection: "cache",

  connections: {
    /*
    |--------------------------------------------------------------------------
    | The default connection
    |--------------------------------------------------------------------------
    |
    | The main connection you want to use to execute redis commands. The same
    | connection will be used by the session provider, if you rely on the
    | redis driver.
    |
    */
    session: {
      host: env.get("REDIS_HOST"),
      port: env.get("REDIS_PORT"),
      keyPrefix: "session:",
    },
    cache: {
      host: env.get("REDIS_HOST"),
      port: env.get("REDIS_PORT"),
      /**
       * Exponential backoff with full jitter
       * https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
       */
      retryStrategy(retries) {
        if (retries > 10) return null;
        const delayMs = 50;
        const maxDelayMs = 5000;
        const baseDelay = delayMs * 2 ** (retries - 1);
        const cappedDelay = Math.min(baseDelay, maxDelayMs);
        const fullJitter = Math.floor(Math.random() * cappedDelay);
        return fullJitter;
      },
    },
  },
});

export default redisConfig;

declare module "@adonisjs/redis/types" {
  export interface RedisConnections extends InferConnections<
    typeof redisConfig
  > {}
}
