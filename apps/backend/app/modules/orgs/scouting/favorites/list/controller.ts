import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListFavoritesService } from "./service.ts";

export default class ListFavoritesController {
  @inject()
  async handle(ctx: HttpContext, service: ListFavoritesService) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event as a coach to scout.",
      });
    }

    const rows = await service.execute(ctx.orgEvent!.id, ctx.orgRoster.id);
    return ctx.response.ok(rows);
  }
}
