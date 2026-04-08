import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { readFile } from "node:fs/promises";
import { UploadDancersService } from "./service.ts";
import { schema } from "./validator.ts";

export default class UploadDancersController {
  @inject()
  async handle(ctx: HttpContext, service: UploadDancersService) {
    const { file } = await ctx.request.validateUsing(schema);
    const user = ctx.auth.getUserOrFail();
    const csv = (await readFile(file.tmpPath!)).toString("utf8");
    // Use a placeholder fileUrl — real S3/R2 upload can be wired up later
    const fileUrl = `uploads/org-csv/${ctx.org!.slug}/${Date.now()}.csv`;
    const result = await service.execute({
      orgId: ctx.org!.id,
      eventId: ctx.params.id,
      uploaderId: user.id,
      fileUrl,
      csv,
    });
    return ctx.response.ok(result);
  }
}
