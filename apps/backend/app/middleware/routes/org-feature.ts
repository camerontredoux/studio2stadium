import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";
import {
  eventTierIncludes,
  isEventTierCapability,
  type EventTierCapability,
} from "#shared/org/event-tiers";

/**
 * Org-wide configuration that gates a route but is not bought per event. These
 * keys stay on `organizations.features`: they are how the Org is set up rather
 * than what it paid for at one Org Event (ADR 0002).
 */
export type OrgConfigurationFlag = "freeTierUsers";

/**
 * Gates a route behind what the request's Org Event includes, or — for org-wide
 * configuration — behind the org's `features` JSONB flag.
 *
 * Usage (inside a route group that has already resolved ctx.org, and ctx.orgEvent
 * for a capability key):
 *
 *   router
 *     .post("callbacks", [CreateCallback])
 *     .use(middleware.orgFeature("callbacks"));
 *
 * A capability resolves from the active Org Event's Event Tier, so two events
 * under one Org gate independently of each other and an Org gets what it bought
 * at each. The event must already be on the request: `middleware.orgEvent()`
 * belongs *before* this one in the group, and an unresolved event is treated as
 * no entitlement rather than as a reason to fall back to the Org.
 *
 * If the capability is not included — or the flag is missing or falsy — the
 * middleware 404s (not 403) so the route is *invisible* to clients that do not
 * have it, rather than teasing it as "disabled".
 */
export default class OrgFeatureMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    key: EventTierCapability | OrgConfigurationFlag
  ) {
    if (!this.isEntitled(ctx, key)) {
      return ctx.response.notFound({ message: "Not found." });
    }
    return next();
  }

  private isEntitled(
    ctx: HttpContext,
    key: EventTierCapability | OrgConfigurationFlag
  ): boolean {
    if (isEventTierCapability(key)) {
      const eventTier = ctx.orgEvent?.eventTier;
      return eventTier !== undefined && eventTierIncludes(eventTier, key);
    }

    const features = (ctx.org?.features ?? {}) as Record<string, boolean>;
    return Boolean(features[key]);
  }
}
