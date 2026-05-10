import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ExportRosterService } from "./service.ts";
import { schema } from "./validator.ts";

export default class ExportRosterController {
  @inject()
  async handle(ctx: HttpContext, service: ExportRosterService) {
    const payload = await ctx.request.validateUsing(schema);
    const csv = await service.execute(ctx.params.id, payload);
    const filename = `${payload.type}s-export.csv`;
    ctx.response.header("Content-Type", "text/csv; charset=utf-8");
    ctx.response.header(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    return ctx.response.send(csv);
  }
}
