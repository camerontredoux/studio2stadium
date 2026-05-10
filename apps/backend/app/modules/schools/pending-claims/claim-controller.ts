import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { PendingClaimsService } from "./service.ts";

export default class ClaimRosterController {
  @inject()
  async handle(
    { auth, params, response }: HttpContext,
    service: PendingClaimsService
  ) {
    const user = await auth.authenticate();
    const result = await service.claim(user.id, params.rosterId);
    if ("notFound" in result) {
      return response.notFound({
        message: "Roster row not found or already claimed.",
      });
    }
    return response.ok({ claimed: true });
  }
}
