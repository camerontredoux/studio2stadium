import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";

export default class LogoutController {
  @inject()
  async handle({ auth, response }: HttpContext) {
    await auth.use("web").logout();
    return response.ok({
      message: "Logged out successfully",
    });
  }
}
