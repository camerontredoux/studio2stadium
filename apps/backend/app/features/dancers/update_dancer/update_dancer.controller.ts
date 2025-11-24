import { UpdateDancerService } from "./update_dancer.service.js";
import { UpdateDancerValidator } from "./update_dancer.validator.js";
import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";

export default class UpdateDancerController {
  @inject()
  async handle({ request }: HttpContext, service: UpdateDancerService) {
    const body = await request.validateUsing(UpdateDancerValidator);
  }
}
