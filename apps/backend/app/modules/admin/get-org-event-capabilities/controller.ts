import { E_NOT_FOUND } from "#exceptions/not-found";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class GetOrgEventCapabilitiesController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(schema);
    const events = await service.execute(payload);
    if (!events) {
      throw new E_NOT_FOUND("Organization not found", {
        code: "E_ORG_NOT_FOUND",
      });
    }
    return ctx.response.ok(events);
  }
}
