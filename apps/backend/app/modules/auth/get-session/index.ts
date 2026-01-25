import type { HttpContext } from "@adonisjs/core/http";

export default class GetSessionController {
  async handle({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail();
    return response.ok(user);
  }
}
