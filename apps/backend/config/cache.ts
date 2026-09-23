import { redisKeyPrefix } from "#shared/redis/key-prefix";
import { defineConfig, drivers, store } from "@adonisjs/cache";

const cacheConfig = defineConfig({
  default: "default",
  /**
   * L2 keys are namespaced by the "cache" connection's ioredis keyPrefix. The
   * bus is not: it publishes on a fixed channel ("bentocache.notifications:
   * default") that ioredis never prefixes, and receivers match messages on
   * this bentocache prefix. Changing it under REDIS_KEY_PREFIX makes each
   * environment ignore the other's invalidations. Unset keeps the default.
   */
  ...(redisKeyPrefix ? { prefix: `${redisKeyPrefix}bentocache` } : {}),
  stores: {
    default: store()
      .useL1Layer(drivers.memory({ maxSize: "64mb" }))
      .useL2Layer(
        drivers.redis({
          connectionName: "cache",
          prefix: "cache",
        })
      )
      .useBus(drivers.redisBus({ connectionName: "cache" })),
  },
});

export default cacheConfig;

declare module "@adonisjs/cache/types" {
  interface CacheStores extends InferStores<typeof cacheConfig> {}
}
