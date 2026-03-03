import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { validator } from "./validator.ts";

export default class CreateDancerController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(validator);
    const user = ctx.auth.getUserOrFail();
    const isAdmin = user.role === "admin" || user.role === "prodigy_admin";

    await service.createDancer(user.id, payload, isAdmin);
    await ctx.auth.use("redis").bump();

    return ctx.response.noContent();
  }
}
