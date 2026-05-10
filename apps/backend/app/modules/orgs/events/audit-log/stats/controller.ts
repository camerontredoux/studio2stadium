import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { AuditLogStatsService } from "./service.ts";

export default class AuditLogStatsController {
  @inject()
  async handle(ctx: HttpContext, service: AuditLogStatsService) {
    const result = await service.execute(ctx.params.id);
    return ctx.response.ok(result);
  }
}
