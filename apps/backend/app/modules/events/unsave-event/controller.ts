import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class UnsaveEventController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const session = ctx.auth.getUserOrFail();
    const payload = await ctx.request.validateUsing(schema);

    await service.execute(payload, session.id);

    return ctx.response.noContent();
  }
}
