import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import transmit from "@adonisjs/transmit/services/main";
import { DeleteCallbackService } from "./service.ts";

export default class DeleteCallbackController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteCallbackService) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event as a coach to scout.",
      });
    }

    const dancerRosterId = ctx.params.dancerRosterId as string;
    await service.execute(ctx.orgEvent!.id, ctx.orgRoster.id, dancerRosterId);

    transmit.broadcast(`orgs/${ctx.org!.slug}/callbacks`, {});

    return ctx.response.noContent();
  }
}
