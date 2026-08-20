import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { PublishShowcaseService } from "../publish/service.ts";
import { EnsureActiveShowcaseService } from "../ensure-active/service.ts";

export default class PublishPreviewController {
  @inject()
  async handle(
    ctx: HttpContext,
    service: PublishShowcaseService,
    ensureShowcase: EnsureActiveShowcaseService
  ) {
    const showcase = await ensureShowcase.execute(ctx.orgEvent!.id);
    const settings = (ctx.org!.settings ?? {}) as {
      max_callbacks_per_coach?: number;
    };
    const maxCallbacks = settings.max_callbacks_per_coach ?? 5;

    const preview = await service.preview(
      ctx.orgEvent!.id,
      showcase.id,
      maxCallbacks
    );

    return ctx.response.ok(preview);
  }
}
