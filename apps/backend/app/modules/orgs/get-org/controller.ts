import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { GetOrgService } from "./service.ts";

export default class GetOrgController {
  @inject()
  async handle({ params, response }: HttpContext, service: GetOrgService) {
    const org = await service.execute(params.slug);
    if (!org) {
      return response.notFound({ message: "Organization not found." });
    }
    return response.ok({
      id: org.id,
      slug: org.slug,
      name: org.name,
      logoUrl: org.logoUrl,
      primaryColor: org.primaryColor,
      accentColor: org.accentColor,
      features: org.features,
      settings: org.settings,
    });
  }
}
