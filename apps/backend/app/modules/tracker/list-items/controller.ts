import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { ListTrackerItemsService } from "./service.ts";

export default class ListTrackerItemsController {
  @inject()
  async handle(ctx: HttpContext, service: ListTrackerItemsService) {
    const tracker = await service.execute(ctx.session.profileId);

    return ctx.response.ok(tracker);
  }
}
