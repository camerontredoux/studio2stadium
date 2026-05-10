import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { readFile } from "node:fs/promises";
import { UploadPreviewService, type UploadKind } from "./service.ts";
import { schema } from "./validator.ts";

export default class UploadPreviewController {
  @inject()
  async handle(ctx: HttpContext, service: UploadPreviewService) {
    const { file } = await ctx.request.validateUsing(schema);
    const type = ctx.params.type as string;
    if (type !== "dancers" && type !== "coaches") {
      return ctx.response.badRequest({
        message: `Unknown upload type: ${type}`,
      });
    }
    const kind: UploadKind = type === "dancers" ? "dancer" : "coach";
    const csvBuf = await readFile(file.tmpPath!);
    const csv = csvBuf.toString("utf8");
    const result = await service.execute({
      orgId: ctx.org!.id,
      eventId: ctx.params.id,
      kind,
      csv,
    });
    return ctx.response.ok(result);
  }
}
