import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class RemoveOrgMemberController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(schema);
    const deleted = await service.execute(payload);

    if (!deleted) {
      throw new E_BAD_REQUEST("Membership not found", {
        code: "E_MEMBERSHIP_NOT_FOUND",
      });
    }

    return ctx.response.noContent();
  }
}
