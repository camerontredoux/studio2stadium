import { GetDancerByIdService } from "./get_dancer_by_id.service.js";
import { GetDancerByIdValidator } from "./get_dancer_by_id.validator.js";
import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";

export default class GetDancerByIdController {
  @inject()
  async handle({ request }: HttpContext, service: GetDancerByIdService) {
    const body = await request.validateUsing(GetDancerByIdValidator);
  }
}
