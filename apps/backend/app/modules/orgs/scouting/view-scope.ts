import { db } from "#database/connection";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { eventShowcases } from "#database/schema/event-features";
import { and, desc, eq } from "drizzle-orm";

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

  // Read-only lookup on purpose: a past event must never have a showcase
  // opened on it just because someone browsed back to it.
  const [showcase] = await db
    .select({ id: eventShowcases.id })
    .from(eventShowcases)
    .where(
      and(
        eq(eventShowcases.eventId, event.id),
        eq(eventShowcases.status, "active")
      )
    )
    .orderBy(desc(eventShowcases.number))
    .limit(1);

  return {
    eventId: event.id,
    coachRosterId: roster?.id ?? null,
    showcaseId: showcase?.id ?? null,
  };
}
