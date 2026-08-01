import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ReconciliationService } from "./service.ts";

export default class ResendInviteController {
  @inject()
  async handle(
    { params, response }: HttpContext,
    service: ReconciliationService
  ) {
    const result = await service.resendInvite(
      params.inviteId,
      params.id,
      params.slug
    );
    if ("notFound" in result) {
      return response.notFound({ message: "Invite not found." });
    }
    if ("alreadyClaimed" in result) {
      return response.conflict({
        message: "This coach has already registered.",
      });
    }
    return response.ok({ resent: true });
  }
}
