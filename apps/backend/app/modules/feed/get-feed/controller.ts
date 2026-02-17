import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { validator } from "./validator.ts";

export default class GetFeedController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const session = ctx.auth.getUserOrFail();
    const { cursor } = await ctx.request.validateUsing(validator);

    const result = await service.execute(session.type, session.id, cursor);

    return ctx.response.ok(result);
  }
}
