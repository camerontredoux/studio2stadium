import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListShowcasesService } from "./service.ts";

export default class ListShowcasesController {
  @inject()
  async handle(ctx: HttpContext, service: ListShowcasesService) {
    const rows = await service.execute(ctx.orgEvent!.id);
    return ctx.response.ok(rows);
  }
}
