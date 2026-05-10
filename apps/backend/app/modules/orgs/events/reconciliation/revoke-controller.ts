import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ReconciliationService } from "./service.ts";

export default class RevokeInviteController {
  @inject()
  async handle(
    { params, response }: HttpContext,
    service: ReconciliationService
  ) {
    const result = await service.revokeInvite(params.inviteId, params.id);
    if ("notFound" in result) {
      return response.notFound({ message: "Invite not found." });
    }
    return response.ok({ revoked: true });
  }
}
