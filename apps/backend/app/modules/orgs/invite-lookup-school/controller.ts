import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { InviteLookupSchoolService } from "./service.ts";

export default class InviteLookupSchoolController {
  @inject()
  async handle(
    { params, response }: HttpContext,
    service: InviteLookupSchoolService
  ) {
    const token = typeof params.token === "string" ? params.token.trim() : "";
    if (token.length < 8 || token.length > 128) {
      return response.gone({ message: "Invite is invalid or has expired." });
    }
    const result = await service.execute(token);
    if (!result) {
      return response.gone({ message: "Invite is invalid or has expired." });
    }
    return response.ok({
      email: result.email,
      organization: result.organization,
      eventId: result.eventId,
      eventName: result.eventName,
      orgName: result.orgName,
      orgSlug: result.orgSlug,
      brandColor: result.brandColor,
      expiresAt: result.expiresAt.toISOString(),
    });
  }
}
