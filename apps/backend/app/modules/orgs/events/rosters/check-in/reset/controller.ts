import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ResetCheckInService } from "./service.ts";

export default class ResetCheckInController {
  @inject()
  async handle(ctx: HttpContext, service: ResetCheckInService) {
    const actorId = ctx.auth.getUserOrFail().id;
    const eventId = ctx.params.id;

    const result = await service.execute(eventId, { eventId, actorId });

    return ctx.response.ok(result);
  }
}
