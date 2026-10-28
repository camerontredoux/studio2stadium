import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { SummarizeDancersService } from "./service.ts";
import { EnsureActiveShowcaseService } from "../../showcases/ensure-active/service.ts";
import { schema } from "../list/validator.ts";
import { resolveDancerListView } from "../../view-scope.ts";

export default class SummarizeDancersController {
  @inject()
  async handle(
    ctx: HttpContext,
    service: SummarizeDancersService,
    ensureShowcase: EnsureActiveShowcaseService
  ) {
    // The same query as the list, so "match your filters" counts what it shows.
    const payload = await ctx.request.validateUsing(schema);
    const view = await resolveDancerListView(
      ctx,
      payload.eventId,
      ensureShowcase
    );
    if (view === false) {
      return ctx.response.unprocessableEntity({
        message: "Selected event does not belong to this organization.",
      });
    }

    const summary = await service.execute(
      ctx.org!.id,
      ctx.orgEvent?.id ?? null,
      view,
      payload,
      payload.eventId
    );
    return ctx.response.ok(summary);
  }
}
