import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { RosterCheckInCodeService } from "./service.ts";

export default class RosterCheckInCodeController {
  @inject()
  async handle(ctx: HttpContext, service: RosterCheckInCodeService) {
    const result = await service.execute({
      orgId: ctx.org!.id,
      eventId: ctx.params.id,
      rosterId: ctx.params.rosterId,
    });
    return ctx.response.ok(result);
  }
}
