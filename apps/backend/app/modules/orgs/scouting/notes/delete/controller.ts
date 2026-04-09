import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { DeleteNoteService } from "./service.ts";

export default class DeleteNoteController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteNoteService) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event as a coach to scout.",
      });
    }

    const dancerRosterId = ctx.params.dancerRosterId as string;
    await service.execute(ctx.orgEvent!.id, ctx.orgRoster.id, dancerRosterId);
    return ctx.response.noContent();
  }
}
