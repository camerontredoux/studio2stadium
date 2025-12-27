import type { HttpContext } from "@adonisjs/core/http";

export default class RefreshSessionController {
  async handle({ auth, response }: HttpContext) {
    await auth.use("redis").refresh();

    return response.ok({
      message: "Session invalidated successfully",
    });
  }
}
