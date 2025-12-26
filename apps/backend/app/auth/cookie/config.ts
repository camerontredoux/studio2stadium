import type { GuardConfigProvider } from "@adonisjs/auth/types";
import type { HttpContext } from "@adonisjs/core/http";
import type { ConfigProvider } from "@adonisjs/core/types";
import { CookieGuard } from "./guard.ts";
import type { CookieUserProviderContract } from "./types.ts";

/**
 * Configures session tokens guard for authentication
 */
export function cookieGuard<UserProvider extends CookieUserProviderContract<unknown>>(config: {
  provider: UserProvider | ConfigProvider<UserProvider>;
}): GuardConfigProvider<(ctx: HttpContext) => CookieGuard<UserProvider>> {
  return {
    async resolver(name, app) {
      const provider =
        "resolver" in config.provider ? await config.provider.resolver(app) : config.provider;
      return (ctx) => new CookieGuard(name, ctx, provider);
    },
  };
}
