import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { GetUsernameAvailableService } from "./service.ts";
import { getUsernameAvailableValidator } from "./validator.ts";

export default class GetUsernameAvailableController {
  @inject()
  async handle(
    { request, response }: HttpContext,
    service: GetUsernameAvailableService
  ) {
    const payload = await request.validateUsing(getUsernameAvailableValidator);

    const available = await service.execute(payload);

    return response.ok({
      available,
    });
  }
}
