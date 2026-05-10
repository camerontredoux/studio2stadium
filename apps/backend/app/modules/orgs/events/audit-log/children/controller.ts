import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListAuditLogChildrenService } from "./service.ts";

export default class ListAuditLogChildrenController {
  @inject()
  async handle(ctx: HttpContext, service: ListAuditLogChildrenService) {
    const result = await service.execute(ctx.params.id, ctx.params.entryId);
    return ctx.response.ok(result);
  }
}
