import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ResendInvitesService } from "./service.ts";
import { schema } from "./validator.ts";

export default class ResendInvitesController {
  @inject()
  async handle(ctx: HttpContext, service: ResendInvitesService) {
    const payload = await ctx.request.validateUsing(schema);
    const result = await service.execute(
      ctx.params.slug,
      ctx.params.id,
      payload,
    );
    return ctx.response.ok(result);
  }
}
