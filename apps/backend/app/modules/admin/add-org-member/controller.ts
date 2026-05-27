import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class AddOrgMemberController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(schema);
    const result = await service.execute(payload);

    if ("error" in result) {
      throw new E_BAD_REQUEST(result.error, {
        code: "E_ADD_MEMBER_FAILED",
      });
    }

    return ctx.response.created(result);
  }
}
