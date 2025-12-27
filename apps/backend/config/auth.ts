import { redisSessionGuard } from "#auth/redis/config";
import env from "#start/env";
import { defineConfig } from "@adonisjs/auth";
import type { Authenticators, InferAuthEvents } from "@adonisjs/auth/types";
import { configProvider } from "@adonisjs/core";

const authConfig = defineConfig({
  default: "redis",
  guards: {
    redis: redisSessionGuard({
      options: {
        cookieCacheName: env.get("COOKIE_CACHE_NAME"),
        cookieCacheTtl: env.get("COOKIE_CACHE_TTL"),
        sessionAge: env.get("SESSION_AGE"),
      },
      provider: configProvider.create(async () => {
        const { RedisUserProvider } = await import("#auth/redis/provider");
        return new RedisUserProvider();
      }),
    }),
  },
});

export default authConfig;

/**
 * Inferring types from the configured auth
 * guards.
 */
declare module "@adonisjs/auth/types" {
  export interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}
declare module "@adonisjs/core/types" {
  interface EventsList extends InferAuthEvents<Authenticators> {}
}
