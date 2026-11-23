import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { DancerAccessExportService } from "./service.ts";

export default class ExportDancerAccessController {
  @inject()
  async handle(ctx: HttpContext, service: DancerAccessExportService) {
    const result = await service.execute();
    const stamp = result.snapshotAt.toISOString().replace(/[:.]/g, "-");

    ctx.response.header("Content-Type", "text/csv; charset=utf-8");
    ctx.response.header(
      "Content-Disposition",
      `attachment; filename="dancer-access-${stamp}.csv"`
    );
    // Customer emails and access: never cached by a browser, proxy or CDN.
    ctx.response.header("Cache-Control", "no-store, private, max-age=0");
    ctx.response.header("Pragma", "no-cache");
    ctx.response.header("X-Export-Row-Count", String(result.rowCount));
    ctx.response.header(
      "X-Export-Access-Lookup-Failures",
      String(result.failedLookups)
    );
    ctx.response.header(
      "X-Export-Snapshot-At",
      result.snapshotAt.toISOString()
    );

    return ctx.response.send(result.csv);
  }
}
