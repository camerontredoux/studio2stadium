import { GetDancersService } from "./get_dancers.service.js";
import { GetDancersValidator } from "./get_dancers.validator.js";
import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";

export default class GetDancersController {
  @inject()
  async handle({ request, response }: HttpContext, service: GetDancersService) {
    const query = await request.validateUsing(GetDancersValidator);
    return response.ok(query);
  }
}
