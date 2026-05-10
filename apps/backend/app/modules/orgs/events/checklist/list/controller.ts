import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { ListChecklistService } from "./service.ts";

export default class ListChecklistController {
  @inject()
  async handle(ctx: HttpContext, service: ListChecklistService) {
    const items = await service.execute(ctx.params.id);
    return ctx.response.ok(items);
  }
}
