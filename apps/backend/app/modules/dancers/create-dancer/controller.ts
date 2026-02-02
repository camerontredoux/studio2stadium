import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { validator } from "./validator.ts";

export default class CreateDancerController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(validator);
    const user = ctx.auth.getUserOrFail();

    await service.createDancer(user.id, payload);
    await ctx.auth.use("redis").bump();

    return ctx.response.noContent();
  }
}
