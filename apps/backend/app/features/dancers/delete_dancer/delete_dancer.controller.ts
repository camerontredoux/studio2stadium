import { DeleteDancerService } from "./delete_dancer.service.js";
import { DeleteDancerValidator } from "./delete_dancer.validator.js";
import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";

export default class DeleteDancerController {
  @inject()
  async handle({ request }: HttpContext, service: DeleteDancerService) {
    const body = await request.validateUsing(DeleteDancerValidator);
  }
}
