import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class DeleteOrgController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(schema);
    const deleted = await service.execute(payload);

    if (!deleted) {
      throw new E_BAD_REQUEST("Organization not found", {
        code: "E_ORG_NOT_FOUND",
      });
    }

    return ctx.response.noContent();
  }
}
