import { defineConfig, drivers, store } from "@adonisjs/cache";

const cacheConfig = defineConfig({
  default: "default",

  stores: {
    default: store()
      .useL1Layer(drivers.memory({ maxSize: "100mb" }))
      .useL2Layer(
        drivers.redis({
          connectionName: "cache",
        })
      )
      .useBus(drivers.redisBus({ connectionName: "cache" })),
  },
});

export default cacheConfig;

declare module "@adonisjs/cache/types" {
  interface CacheStores extends InferStores<typeof cacheConfig> {}
}
