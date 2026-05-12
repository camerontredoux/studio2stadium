import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { GetMyOrgsService } from "./service.ts";

export default class GetMyOrgsController {
  @inject()
  async handle({ response, auth }: HttpContext, service: GetMyOrgsService) {
    const user = auth.getUserOrFail();
    const orgs = await service.execute(user.id);
    return response.ok(orgs);
  }
}
