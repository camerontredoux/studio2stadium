import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { RegisterDancerService, InviteInvalidError } from "./service.ts";
import { schema } from "./validator.ts";

export default class RegisterDancerController {
  @inject()
  async handle(
    { request, params, response }: HttpContext,
    service: RegisterDancerService
  ) {
    const payload = await request.validateUsing(schema);
    try {
      const result = await service.execute(params.slug, payload);
      return response.created(result);
    } catch (err) {
      if (err instanceof InviteInvalidError) {
        return response.badRequest({ message: err.message });
      }
      throw err;
    }
  }
}
