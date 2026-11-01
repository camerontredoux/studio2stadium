import { E_NOT_FOUND } from "#exceptions/not-found";
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { GetVideoUploadService } from "./service.ts";
import { schema } from "./validator.ts";

export default class GetVideoUploadController {
  @inject()
  async handle(ctx: HttpContext, service: GetVideoUploadService) {
    const { params } = await ctx.request.validateUsing(schema);
    const user = ctx.auth.getUserOrFail();

    const upload = await service.execute(params.mediaId, user);

    if (!upload) {
      throw new E_NOT_FOUND("Upload not found");
    }

    return ctx.response.ok(upload);
  }
}
