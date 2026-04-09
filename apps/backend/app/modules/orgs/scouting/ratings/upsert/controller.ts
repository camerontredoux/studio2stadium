import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { UpsertRatingService } from "./service.ts";
import { schema } from "./validator.ts";

export default class UpsertRatingController {
  @inject()
  async handle(ctx: HttpContext, service: UpsertRatingService) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event as a coach to scout.",
      });
    }

    const payload = await ctx.request.validateUsing(schema);

    const settings = (ctx.org!.settings ?? {}) as { rating_scale_max?: number };
    const max = settings.rating_scale_max ?? 10;

    if (payload.rating < 1 || payload.rating > max) {
      return ctx.response.unprocessableEntity({
        errors: [
          { field: "rating", message: `Rating must be between 1 and ${max}.` },
        ],
      });
    }

    const dancerRosterId = ctx.params.dancerRosterId as string;
    const row = await service.execute(
      ctx.orgEvent!.id,
      ctx.orgRoster.id,
      dancerRosterId,
      payload.rating
    );
    return ctx.response.ok(row);
  }
}
