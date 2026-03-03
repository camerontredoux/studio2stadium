import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class FeedbackController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(schema);
    const user = ctx.auth.getUserOrFail();

    await service.execute(payload, user);

    return ctx.response.noContent();
  }
}
