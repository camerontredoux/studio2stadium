import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { validator } from "./validator.ts";

export default class GetNotificationsController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const session = ctx.auth.getUserOrFail();
    const input = await ctx.request.validateUsing(validator, {
      data: ctx.request.qs(),
    });

    const result = await service.execute(session.id, input.cursor);

    return ctx.response.ok(result);
  }
}
