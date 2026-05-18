import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import transmit from "@adonisjs/transmit/services/main";
import { DeleteCallbackService } from "./service.ts";
import { EnsureActiveShowcaseService } from "../../showcases/ensure-active/service.ts";

export default class DeleteCallbackController {
  @inject()
  async handle(
    ctx: HttpContext,
    service: DeleteCallbackService,
    ensureShowcase: EnsureActiveShowcaseService
  ) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event as a coach to scout.",
      });
    }

    const showcase = await ensureShowcase.execute(ctx.orgEvent!.id);

    if (showcase.status !== "active") {
      return ctx.response.conflict({
        message: "Cannot remove callbacks — the current showcase has been published.",
      });
    }

    const dancerRosterId = ctx.params.dancerRosterId as string;
    await service.execute(showcase.id, ctx.orgRoster.id, dancerRosterId);

    transmit.broadcast(`orgs/${ctx.org!.slug}/callbacks`, {});

    return ctx.response.noContent();
  }
}
