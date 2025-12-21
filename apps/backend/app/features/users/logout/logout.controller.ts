import type { HttpContext } from "@adonisjs/core/http";
import redis from "@adonisjs/redis/services/main";

export default class LogoutController {
  async handle({ auth, response }: HttpContext) {
    await redis.del(`user:${auth.getUserOrFail().id}`);
    await auth.use("web").logout();
    return response.ok({
      message: "Logged out successfully",
    });
  }
}
