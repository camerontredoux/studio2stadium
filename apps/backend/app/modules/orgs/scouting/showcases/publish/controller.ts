import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import transmit from "@adonisjs/transmit/services/main";
import { PublishShowcaseService } from "./service.ts";
import { EnsureActiveShowcaseService } from "../ensure-active/service.ts";
import { schema } from "./validator.ts";
import {
  UNLIMITED_CALLBACKS,
  resolveMaxCallbacks,
} from "#shared/org/max-callbacks";

export default class PublishShowcaseController {
  @inject()
  async handle(
    ctx: HttpContext,
    service: PublishShowcaseService,
    ensureShowcase: EnsureActiveShowcaseService
  ) {
    const payload = await ctx.request.validateUsing(schema);
    const showcase = await ensureShowcase.execute(ctx.orgEvent!.id);

    if (showcase.status !== "active") {
      return ctx.response.conflict({
        message: "Showcase has already been published.",
      });
    }

    const maxCallbacks = payload.publishAll
      ? UNLIMITED_CALLBACKS
      : resolveMaxCallbacks(ctx.org!.settings);

    const result = await service.execute(
      ctx.orgEvent!.id,
      showcase.id,
      maxCallbacks
    );

    transmit.broadcast(`orgs/${ctx.org!.slug}/callbacks`, {});
    transmit.broadcast(`orgs/${ctx.org!.slug}/showcases`, {});

    return ctx.response.ok({ message: "Showcase published", ...result });
  }
}
