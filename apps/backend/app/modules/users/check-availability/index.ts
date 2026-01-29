import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { CheckAvailabilityService } from "./service.ts";
import { checkAvailabilityValidator } from "./validator.ts";

export default class CheckAvailabilityController {
  @inject()
  async handle(
    { request, response }: HttpContext,
    service: CheckAvailabilityService
  ) {
    const payload = await request.validateUsing(checkAvailabilityValidator);

    const available = await service.execute(payload);

    return response.ok({
      available,
    });
  }
}
