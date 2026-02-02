import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";

export default class GetSessionController {
  @inject()
  async handle({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail();

    return response.ok(user);
  }
}
