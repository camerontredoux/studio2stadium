import { defineConfig } from "@adonisjs/auth";
import { sessionGuard } from "@adonisjs/auth/session";
import type { Authenticators, InferAuthEvents } from "@adonisjs/auth/types";
import { configProvider } from "@adonisjs/core";

const authConfig = defineConfig({
  default: "cookie",
  guards: {
    cookie: sessionGuard({
      useRememberMeTokens: false,
      provider: configProvider.create(async () => {
        const { SessionUserProvider } = await import("../app/auth/redis/provider.ts");
        return new SessionUserProvider();
      }),
    }),
    redis: sessionGuard({
      useRememberMeTokens: false,
      provider: {
        resolver: async () => {
          const { SessionUserProvider } = await import("../app/auth/redis/provider.ts");
          return new SessionUserProvider();
        },
        type: "provider",
      },
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
