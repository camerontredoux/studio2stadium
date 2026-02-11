import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { validator } from "./validator.ts";

export default class SubmitApplicationController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(validator);
    const session = ctx.auth.getUserOrFail();

    await service.execute(session.id, payload);

    return ctx.response.noContent();
  }
}
