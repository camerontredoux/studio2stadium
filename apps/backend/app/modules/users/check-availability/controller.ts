import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { validator } from "./validator.ts";

export default class CheckAvailabilityController {
  @inject()
  async handle({ request, response }: HttpContext, service: Service) {
    const payload = await request.validateUsing(validator);

    const available = await service.execute(payload);

    return response.ok({
      available,
    });
  }
}
