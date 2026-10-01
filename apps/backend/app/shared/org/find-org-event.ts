import { db } from "#database/connection";
import { orgEvents } from "#database/schema/org-events";
import { and, eq } from "drizzle-orm";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Finds the Org Event with this id that belongs to this Org. A malformed id is
 * treated as not found, so it never reaches Postgres (which would reject the
 * uuid cast with a 500).
 */
export async function findOrgEvent(
  orgId: string,
  eventId: string | undefined
): Promise<typeof orgEvents.$inferSelect | undefined> {
  if (!eventId || !UUID.test(eventId)) return undefined;

  const [event] = await db
    .select()
    .from(orgEvents)
    .where(and(eq(orgEvents.id, eventId), eq(orgEvents.orgId, orgId)))
    .limit(1);

  return event;
}
