import type { HttpContext } from "@adonisjs/core/http";

export default class LogoutController {
  async handle(ctx: HttpContext) {
    const { auth, response } = ctx;

    await auth.use("redis").logout();

    return response.ok({
      message: "Logged out successfully",
    });
  }
}
