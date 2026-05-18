import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import transmit from "@adonisjs/transmit/services/main";
import { StartNextShowcaseService } from "./service.ts";

export default class StartNextShowcaseController {
  @inject()
  async handle(ctx: HttpContext, service: StartNextShowcaseService) {
    try {
      const showcase = await service.execute(ctx.orgEvent!.id);
      transmit.broadcast(`orgs/${ctx.org!.slug}/callbacks`, {});
      transmit.broadcast(`orgs/${ctx.org!.slug}/showcases`, {});
      return ctx.response.created(showcase);
    } catch (error) {
      return ctx.response.conflict({
        message:
          error instanceof Error
            ? error.message
            : "Cannot start next showcase",
      });
    }
  }
}
