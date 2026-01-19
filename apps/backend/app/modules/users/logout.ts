import type { HttpContext } from "@adonisjs/core/http";

export default class LogoutController {
  async handle({ auth, response }: HttpContext) {
    await auth.use("redis").logout();

    return response.ok({
      message: "Logged out successfully",
    });
  }
}
