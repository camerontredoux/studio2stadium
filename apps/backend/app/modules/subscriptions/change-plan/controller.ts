import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { ChangePlanService } from "./service.ts";
import { schema } from "./validator.ts";

export default class ChangePlanController {
  @inject()
  async handle(ctx: HttpContext, service: ChangePlanService) {
    const user = ctx.auth.getUserOrFail();

    const payload = await ctx.request.validateUsing(schema);

    return ctx.response.ok(await service.execute(user.id, payload));
  }
}
