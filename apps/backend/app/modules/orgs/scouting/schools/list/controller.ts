import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListSchoolsService } from "./service.ts";

export default class ListSchoolsController {
  @inject()
  async handle(ctx: HttpContext, service: ListSchoolsService) {
    const rows = await service.execute(
      ctx.orgEvent!.id,
      ctx.orgRoster?.id ?? null
    );
    return ctx.response.ok(rows);
  }
}
