import { redisSessionGuard } from "#auth/config";
import { cookieDomain } from "#config/app";
import type { SessionUser } from "#auth/provider";
import { defineConfig } from "@adonisjs/auth";
import type { Authenticators, InferAuthEvents } from "@adonisjs/auth/types";
import { configProvider } from "@adonisjs/core";
import app from "@adonisjs/core/services/app";
import env from "#start/env";

const authConfig = defineConfig({
  default: "redis",
  guards: {
    redis: redisSessionGuard<SessionUser>({
      options: {
        cacheCookieName: env.get("CACHE_COOKIE_NAME") ?? "auth_cache",
        cacheCookieAge: 60 * 5,
        sessionCookieName: env.get("SESSION_COOKIE_NAME") ?? "auth_session",
        sessionAge: 60 * 60 * 24 * 7,
        cookieOptions: (maxAge) => ({
          maxAge,
          domain: cookieDomain,
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
