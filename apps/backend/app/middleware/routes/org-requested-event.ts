import { findOrgEvent } from "#shared/org/find-org-event";
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

/**
 * Puts the Org Event a route names in its `:id` param on `ctx.orgEvent`, so
 * `middleware.orgFeature(...)` gates on the event being acted on rather than
 * the Org's active one.
 *
 * What an Org Event includes is bought per event (ADR 0002), and routes under
 * `:slug/events/:id/...` read or change that one event's data — which need not
 * be the active one. Gating them on the active event would let a Core event's
 * video library be managed because another event bought it, and shut an
 * Enterprise event's out because the active one did not. This is the same
 * answer `orgEvent("dancerSelfRead")` already gives a Dancer (#110), extended
 * to everyone.
 *
 * An event that is not the Org's 404s, so a route cannot reach another Org's
 * event through this one's admin.
 *
 * Compose after `org` (and after `orgEvent`, whose roster checks still decide
 * who may make the request) and before `orgFeature`. When the named event
 * differs from the one `orgEvent` resolved, the roster it attached belongs to
 * the other event, so it is dropped rather than paired with the wrong event.
 */
export default class OrgRequestedEventMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (!ctx.org) {
      return ctx.response.notFound({ message: "Org not resolved." });
    }

    const eventId = ctx.params.id as string | undefined;
    if (eventId && ctx.orgEvent?.id === eventId) return next();

    const event = await findOrgEvent(ctx.org.id, eventId);
    if (!event) {
      return ctx.response.notFound({ message: "No event found." });
    }

    ctx.orgEvent = event;
    if (ctx.orgRoster && ctx.orgRoster.eventId !== event.id) {
      ctx.orgRoster = undefined;
    }

    return next();
  }
}
