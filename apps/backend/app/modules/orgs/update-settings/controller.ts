import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { UpdateOrgSettingsService } from "./service.ts";
import { schema } from "./validator.ts";

export default class UpdateOrgSettingsController {
  @inject()
  async handle(ctx: HttpContext, service: UpdateOrgSettingsService) {
    const payload = await ctx.request.validateUsing(schema);
    const org = await service.execute(ctx.org!.id, payload);
    if (!org) {
      return ctx.response.notFound({ message: "Organization not found." });
    }
    return ctx.response.ok({
      settings: org.settings,
    });
  }
}
