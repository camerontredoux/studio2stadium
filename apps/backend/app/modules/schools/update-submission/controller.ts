import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class UpdateSubmissionController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const user = ctx.auth.getUserOrFail();
    const payload = await ctx.request.validateUsing(schema);
    const isAdmin = user.role === "admin" || user.role === "prodigy_admin";

    await service.execute(ctx.session.profileId, payload, isAdmin);

    return ctx.response.noContent();
  }
}
