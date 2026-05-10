import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { PendingClaimsService } from "./service.ts";

export default class DismissClaimController {
  @inject()
  async handle(
    { auth, params, response }: HttpContext,
    service: PendingClaimsService
  ) {
    const user = await auth.authenticate();
    await service.dismiss(user.id, params.rosterId);
    return response.ok({ dismissed: true });
  }
}
