import type { HttpContext } from "@adonisjs/core/http";

export default class GetSessionController {
  async handle({ auth }: HttpContext) {
    const user = auth.getUserOrFail();
    return user;
  }
}
