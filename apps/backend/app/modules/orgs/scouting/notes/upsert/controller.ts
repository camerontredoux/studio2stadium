import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { UpsertNoteService } from "./service.ts";
import { schema } from "./validator.ts";

export default class UpsertNoteController {
  @inject()
  async handle(ctx: HttpContext, service: UpsertNoteService) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event as a coach to scout.",
      });
    }

    const payload = await ctx.request.validateUsing(schema);
    const dancerRosterId = ctx.params.dancerRosterId as string;
    const row = await service.execute(
      ctx.orgEvent!.id,
      ctx.orgRoster.id,
      dancerRosterId,
      payload.content
    );
    return ctx.response.ok(row);
  }
}
