import { sessionCache } from "#utils/cookie-cache";
import type { HttpContext } from "@adonisjs/core/http";

export default class InvalidateSessionController {
  async handle(ctx: HttpContext) {
    const { auth, response } = ctx;
    const userId = auth.getUserOrFail().id;

    await sessionCache.invalidate(userId);

    return response.ok({
      message: "Session invalidated successfully",
    });
  }
}
