import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { PublishShowcaseService } from "../publish/service.ts";
import { EnsureActiveShowcaseService } from "../ensure-active/service.ts";
import { resolveMaxCallbacks } from "#shared/org/max-callbacks";

export default class PublishPreviewController {
  @inject()
  async handle(
    ctx: HttpContext,
    service: PublishShowcaseService,
    ensureShowcase: EnsureActiveShowcaseService
  ) {
    const showcase = await ensureShowcase.execute(ctx.orgEvent!.id);
    const maxCallbacks = resolveMaxCallbacks(ctx.org!.settings);

    const preview = await service.preview(
      ctx.orgEvent!.id,
      showcase.id,
      maxCallbacks
    );

    return ctx.response.ok(preview);
  }
}
