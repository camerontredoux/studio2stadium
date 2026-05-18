import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListCallbacksService } from "./service.ts";
import { EnsureActiveShowcaseService } from "../../showcases/ensure-active/service.ts";

export default class ListCallbacksController {
  @inject()
  async handle(
    ctx: HttpContext,
    service: ListCallbacksService,
    ensureShowcase: EnsureActiveShowcaseService
  ) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event as a coach to scout.",
      });
    }

    const showcase = await ensureShowcase.execute(ctx.orgEvent!.id);
    const rows = await service.execute(showcase.id, ctx.orgRoster.id);
    return ctx.response.ok(rows);
  }
}
