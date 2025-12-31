import type { GuardConfigProvider } from "@adonisjs/auth/types";
import type { HttpContext } from "@adonisjs/core/http";
import type { ConfigProvider } from "@adonisjs/core/types";
import { RedisSessionGuard } from "./guard.ts";
import type { RedisGuardOptions, RedisUserProviderContract } from "./types.ts";

/**
 * Configures the Redis session guard for authentication.
 * The provider is resolved once (singleton) and the guard is created per-request.
 */
export function redisSessionGuard<
  User,
  UserProvider extends RedisUserProviderContract<User> =
    RedisUserProviderContract<User>,
>(
  config: {
    provider: UserProvider | ConfigProvider<UserProvider>;
  } & {
    options: RedisGuardOptions;
  }
): GuardConfigProvider<
  (ctx: HttpContext) => RedisSessionGuard<User, UserProvider>
> {
  return {
    async resolver(_name, app) {
      const provider =
        "resolver" in config.provider
          ? await config.provider.resolver(app)
          : config.provider;
      return (ctx) => new RedisSessionGuard(ctx, provider, config.options);
    },
  };
}
