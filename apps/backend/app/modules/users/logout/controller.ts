import { sessionCache } from "#utils/cookie-cache";
import type { HttpContext } from "@adonisjs/core/http";

export default class LogoutController {
  async handle(ctx: HttpContext) {
    const { auth, response } = ctx;
    const userId = auth.getUserOrFail().id;

    await sessionCache.clearAllCaches(ctx, userId);
    await auth.use("redis").logout();

    return response.ok({
      message: "Logged out successfully",
    });
  }
}
