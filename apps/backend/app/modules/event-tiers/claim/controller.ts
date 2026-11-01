import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { Service } from "./service.ts";
import { schema } from "./validator.ts";

export default class ClaimOrgController {
  @inject()
  async handle(ctx: HttpContext, service: Service) {
    const payload = await ctx.request.validateUsing(schema);
    const user = ctx.auth.getUserOrFail();

    const result = await service.execute(user.id, payload);

    // The session carries the user's Org memberships; refresh it so the Org
    // they just claimed shows up.
    await ctx.auth.use("redis").bump();

    return ctx.response.ok(result);
  }
}
