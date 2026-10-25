import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ScanCheckInService } from "./service.ts";
import { schema } from "./validator.ts";

export default class ScanCheckInController {
  @inject()
  async handle(ctx: HttpContext, service: ScanCheckInService) {
    const { code } = await ctx.request.validateUsing(schema);
    const result = await service.execute({
      orgId: ctx.org!.id,
      eventId: ctx.params.id,
      code,
      actorId: ctx.auth.getUserOrFail().id,
    });
    return ctx.response.ok(result);
  }
}
