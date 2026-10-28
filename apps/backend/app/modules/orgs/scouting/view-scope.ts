import { db } from "#database/connection";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { eventShowcases } from "#database/schema/event-features";
import { and, desc, eq } from "drizzle-orm";
import type { HttpContext } from "@adonisjs/core/http";
import type { EnsureActiveShowcaseService } from "./showcases/ensure-active/service.ts";

export interface ScoutingViewScope {
  /** The event the coach's own scouting data is read against. */
  eventId: string;
  /** The coach's roster row for that event — null when they never attended it. */
  coachRosterId: string | null;
  /** That event's active showcase, if one was ever opened. */
  showcaseId: string | null;
}

/**
 * Favorites, notes and ratings are keyed by (eventId, coachRosterId), and a
 * coach holds a separate roster row per event. Reading a past event therefore
 * has to re-resolve both halves — the active-event roster hanging off the
 * request context would match nothing and the coach would see an empty board.
 *
 * Returns null when the event does not belong to the org.
 */
export async function resolveScoutingViewScope(
  orgId: string,
  userId: string,
  eventId: string
): Promise<ScoutingViewScope | null> {
  const [event] = await db
    .select({ id: orgEvents.id })
    .from(orgEvents)
    .where(and(eq(orgEvents.id, eventId), eq(orgEvents.orgId, orgId)))
    .limit(1);
  if (!event) return null;

  const [roster] = await db
    .select({ id: eventRosters.id })
    .from(eventRosters)
    .where(
      and(
        eq(eventRosters.eventId, event.id),
        eq(eventRosters.userId, userId),
        eq(eventRosters.type, "coach")
      )
    )
    .orderBy(desc(eventRosters.createdAt))
    .limit(1);

  return {
    eventId: event.id,
    coachRosterId: roster?.id ?? null,
    showcaseId: await findActiveShowcaseId(event.id),
  };
}

/**
 * Read-only on purpose: a past event must never have a showcase opened on it
 * just because someone browsed back to it. A finished event's showcase is
 * published rather than active, which is what keeps its callbacks — unlike its
 * favorites, notes and ratings — out of the coach's view.
 */
export async function findActiveShowcaseId(eventId: string) {
  const [showcase] = await db
    .select({ id: eventShowcases.id })
    .from(eventShowcases)
    .where(
      and(
        eq(eventShowcases.eventId, eventId),
        eq(eventShowcases.status, "active")
      )
    )
    .orderBy(desc(eventShowcases.number))
    .limit(1);
  return showcase?.id ?? null;
}

/**
 * The scope the coach's Dancers list and its summary read their marks from:
 * the chosen event's, else the active event's ("All events" keeps the marks
 * on the active event). Null when there is neither. `false` when the chosen
 * event does not belong to the org.
 */
export async function resolveDancerListView(
  ctx: HttpContext,
  eventId: string | undefined,
  ensureShowcase: EnsureActiveShowcaseService
): Promise<ScoutingViewScope | null | false> {
  if (eventId) {
    const view = await resolveScoutingViewScope(
      ctx.org!.id,
      ctx.auth.user!.id,
      eventId
    );
    return view ?? false;
  }
  const event = ctx.orgEvent;
  if (event && ctx.orgRoster) {
    const showcase = await ensureShowcase.execute(event.id);
    return {
      eventId: event.id,
      coachRosterId: ctx.orgRoster.id,
      showcaseId: showcase?.id ?? null,
    };
  }
  return null;
}
