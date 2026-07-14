import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListSchoolsService } from "./service.ts";
import { eventQuerySchema } from "../../event-query-validator.ts";

export default class ListSchoolsController {
  @inject()
  async handle(ctx: HttpContext, service: ListSchoolsService) {
    await ctx.request.validateUsing(eventQuerySchema);
    const rows = await service.execute(
      ctx.orgEvent!.orgId,
      ctx.orgEvent!.id,
      ctx.orgRoster?.id ?? null
    );
    return ctx.response.ok(rows);
  }
}
