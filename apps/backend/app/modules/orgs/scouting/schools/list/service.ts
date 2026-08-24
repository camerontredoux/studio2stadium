import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { eventSchoolSelections } from "#database/schema/event-features";
import { orgMemberships } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { and, eq, sql } from "drizzle-orm";

@inject()
export class ListSchoolsService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    orgId: string,
    activeEventId: string,
    dancerRosterId: string | null
  ) {
    // A school is "starred" for the viewing dancer if a selection exists for
    // this coach roster on the org's active event (where selections are made).
    const isTopSchoolSubquery = dancerRosterId
      ? sql<boolean>`EXISTS (
          SELECT 1 FROM ${eventSchoolSelections}
          WHERE ${eventSchoolSelections.coachRosterId} = ${eventRosters.id}
            AND ${eventSchoolSelections.dancerRosterId} = ${dancerRosterId}
            AND ${eventSchoolSelections.eventId} = ${activeEventId}
        )`
      : sql<boolean>`false`;

    const rows = await this.db.use((db) =>
      db
        .select({
          rosterId: eventRosters.id,
          organization: eventRosters.organization,
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
          username: users.username,
          isTopSchool: isTopSchoolSubquery,
          userId: eventRosters.userId,
          eventId: eventRosters.eventId,
          createdAt: eventRosters.createdAt,
        })
        .from(eventRosters)
        .leftJoin(users, eq(users.id, eventRosters.userId))
        .where(
          and(
            // Every event this org has ever run, not just the active one — a
            // school that appeared on any of the org's rosters stays visible.
            sql`${eventRosters.eventId} IN (
              SELECT ${orgEvents.id} FROM ${orgEvents}
              WHERE ${orgEvents.orgId} = ${orgId}
            )`,
            eq(eventRosters.type, "coach"),
            eq(eventRosters.isStaff, false),
            // Exclude rosters owned by an admin — admins are never real
            // participating schools, even if they hold a non-staff roster
            // created before the is_staff flag existed. Covers both org-level
            // admins (org_memberships.role, plus Organizers, who administer by
            // definition) and platform admins (users.role).
            sql`NOT EXISTS (
              SELECT 1 FROM ${orgMemberships}
              WHERE ${orgMemberships.userId} = ${eventRosters.userId}
                AND ${orgMemberships.orgId} = ${orgId}
                AND (${orgMemberships.role} = 'admin'
                     OR ${orgMemberships.type} = 'organizer')
            )`,
            sql`${users.role} IS DISTINCT FROM 'admin'`
          )
        )
    );

    // The same school can hold a roster row on several of the org's events.
    // Collapse to one row per school — keyed by the coach's account when
    // claimed, otherwise the program name — preferring the active event's row
    // so existing star selections stay wired to the displayed roster.
    const bySchool = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const key =
        row.userId ?? `org:${row.organization?.toLowerCase() ?? row.rosterId}`;
      const current = bySchool.get(key);
      if (!current || this.isBetterRow(row, current, activeEventId)) {
        bySchool.set(key, row);
      }
    }

    return [...bySchool.values()]
      .sort((a, b) =>
        (a.organization ?? "").localeCompare(b.organization ?? "")
      )
      .map((row) => ({
        rosterId: row.rosterId,
        organization: row.organization,
        firstName: row.firstName,
        lastName: row.lastName,
        username: row.username,
        isTopSchool: row.isTopSchool,
      }));
  }

  private isBetterRow(
    candidate: { eventId: string; createdAt: Date | null },
    current: { eventId: string; createdAt: Date | null },
    activeEventId: string
  ) {
    const candidateActive = candidate.eventId === activeEventId;
    const currentActive = current.eventId === activeEventId;
    if (candidateActive !== currentActive) return candidateActive;
    return (
      (candidate.createdAt?.getTime() ?? 0) >
      (current.createdAt?.getTime() ?? 0)
    );
  }
}
