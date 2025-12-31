import { redisSessionGuard } from "#auth/config";
import type { SessionUser } from "#auth/provider";
import { defineConfig } from "@adonisjs/auth";
import type { Authenticators, InferAuthEvents } from "@adonisjs/auth/types";
import { configProvider } from "@adonisjs/core";
import app from "@adonisjs/core/services/app";

const authConfig = defineConfig({
  default: "redis",
  guards: {
    redis: redisSessionGuard<SessionUser>({
      options: {
        cacheCookieName: "auth_cache",
        cacheCookieAge: 60 * 5,
        sessionCookieName: "auth_session",
        sessionAge: 60 * 60 * 24 * 7,
        cookieOptions: (maxAge) => ({
          maxAge,
          path: "/",
          httpOnly: true,
          secure: app.inProduction,
          sameSite: "lax",
        }),
      },
      provider: configProvider.create(async () => {
        const { RedisUserProvider } = await import("#auth/provider");
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
  export interface Authenticators extends InferAuthenticators<
    typeof authConfig
  > {}
}
declare module "@adonisjs/core/types" {
  interface EventsList extends InferAuthEvents<Authenticators> {}
}
