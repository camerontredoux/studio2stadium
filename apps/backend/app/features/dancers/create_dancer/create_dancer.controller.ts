import { CreateDancerService } from "./create_dancer.service.js";
import { CreateDancerValidator } from "./create_dancer.validator.js";
import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";

export default class CreateDancerController {
  @inject()
  async handle({ request }: HttpContext, service: CreateDancerService) {
    const body = await request.validateUsing(CreateDancerValidator);
  }
}
