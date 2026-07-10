import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListDancersService } from "./service.ts";
import { EnsureActiveShowcaseService } from "../../showcases/ensure-active/service.ts";
import { schema } from "./validator.ts";
import { orgEvents } from "#database/schema/org-events";
import { db } from "#database/connection";
import { and, eq } from "drizzle-orm";

export default class ListDancersController {
  @inject()
  async handle(
    ctx: HttpContext,
    service: ListDancersService,
    ensureShowcase: EnsureActiveShowcaseService
  ) {
    const payload = await ctx.request.validateUsing(schema);
    const event = ctx.orgEvent;

    if (payload.eventId) {
      const [selectedEvent] = await db
        .select({ id: orgEvents.id })
        .from(orgEvents)
        .where(
          and(
            eq(orgEvents.id, payload.eventId),
            eq(orgEvents.orgId, ctx.org!.id)
          )
        )
        .limit(1);
      if (!selectedEvent) {
        return ctx.response.unprocessableEntity({
          message: "Selected event does not belong to this organization.",
        });
      }
    }

    // Cross-event browsing never hides unchecked dancers: check-in state only
    // has meaning within the active event, while this endpoint defaults to the
    // organization's complete dancer history.
    const filterCheckedInOnly = false;
    const showcase = event ? await ensureShowcase.execute(event.id) : null;
    const rows = await service.execute(
      ctx.org!.id,
      event?.id ?? null,
      ctx.orgRoster?.id ?? null,
      payload,
      filterCheckedInOnly,
      showcase?.id,
      payload.eventId
    );
    return ctx.response.ok(rows);
  }
}
