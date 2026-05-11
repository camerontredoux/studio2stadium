import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { GetOrgService } from "./service.ts";

export default class GetOrgController {
  @inject()
  async handle(
    { params, response, auth }: HttpContext,
    service: GetOrgService
  ) {
    // Opportunistically resolve the current user so we can attach their
    // membership to the response when signed in. The endpoint itself stays
    // public (login and landing pages hit it without a session).
    let userId: string | null = null;
    try {
      await auth.check();
      userId = auth.user?.id ?? null;
    } catch {
      userId = null;
    }

    const result = await service.execute(params.slug, userId);
    if (!result) {
      return response.notFound({ message: "Organization not found." });
    }
    const { org, membership, myRoster } = result;
    return response.ok({
      id: org.id,
      slug: org.slug,
      name: org.name,
      logoUrl: org.logoUrl,
      primaryColor: org.primaryColor,
      accentColor: org.accentColor,
      features: org.features,
      settings: org.settings,
      membership,
      myRoster,
    });
  }
}
