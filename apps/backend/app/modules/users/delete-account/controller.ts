import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";

export default class DeleteAccountController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const session = ctx.auth.getUserOrFail();

    await service.execute(session.id);

    await ctx.auth.use("redis").logout();

    return ctx.response.noContent();
  }
}
