import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { PendingClaimsService } from "./service.ts";

export default class ListPendingClaimsController {
  @inject()
  async handle({ auth, response }: HttpContext, service: PendingClaimsService) {
    const user = await auth.authenticate();
    const result = await service.list(user.id);
    return response.ok(result);
  }
}
