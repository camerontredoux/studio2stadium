import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import {
  InviteLookupDancerService,
  type InviteLookupDancerResult,
} from "./service.ts";

export default class InviteLookupDancerController {
  @inject()
  async handle(
    { params, response }: HttpContext,
    service: InviteLookupDancerService
  ) {
    const token = typeof params.token === "string" ? params.token.trim() : "";
    const result: InviteLookupDancerResult =
      token.length < 8 || token.length > 64
        ? { status: "invalid" }
        : await service.execute(params.slug, token);

    // Return a single flat shape (nullable prefill fields) so the generated
    // OpenAPI/TanStack Query type keeps every field; a branch-per-status return
    // would collapse to the common `{ status }` and drop `email` etc.
    return response.ok({
      status: result.status,
      email: result.status === "valid" ? result.email : null,
      orgName: result.status === "valid" ? result.orgName : null,
      orgSlug: result.status === "valid" ? result.orgSlug : null,
      brandColor: result.status === "valid" ? result.brandColor : null,
      expiresAt:
        result.status === "valid" ? result.expiresAt.toISOString() : null,
    });
  }
}
