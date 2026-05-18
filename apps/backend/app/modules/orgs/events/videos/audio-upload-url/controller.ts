import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { AudioUploadUrlService } from "./service.ts";
import { schema } from "./validator.ts";

export default class AudioUploadUrlController {
  @inject()
  async handle(ctx: HttpContext, service: AudioUploadUrlService) {
    const payload = await ctx.request.validateUsing(schema);
    return ctx.response.ok(await service.execute(ctx.params.id, payload));
  }
}
