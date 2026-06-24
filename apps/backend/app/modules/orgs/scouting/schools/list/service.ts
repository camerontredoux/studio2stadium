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

  async execute(eventId: string, dancerRosterId: string | null) {
    const isTopSchoolSubquery = dancerRosterId
      ? sql<boolean>`EXISTS (
          SELECT 1 FROM ${eventSchoolSelections}
          WHERE ${eventSchoolSelections.coachRosterId} = ${eventRosters.id}
            AND ${eventSchoolSelections.dancerRosterId} = ${dancerRosterId}
            AND ${eventSchoolSelections.eventId} = ${eventId}
        )`
      : sql<boolean>`false`;

    return this.db.use((db) =>
      db
        .select({
          rosterId: eventRosters.id,
          organization: eventRosters.organization,
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
          username: users.username,
          isTopSchool: isTopSchoolSubquery,
        })
        .from(eventRosters)
        .leftJoin(users, eq(users.id, eventRosters.userId))
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.type, "coach"),
            eq(eventRosters.isStaff, false),
            // Exclude rosters owned by an admin — admins are never real
            // participating schools, even if they hold a non-staff roster
            // created before the is_staff flag existed. Covers both org-level
            // admins (org_memberships.role) and platform admins (users.role).
            sql`NOT EXISTS (
              SELECT 1 FROM ${orgMemberships}
              WHERE ${orgMemberships.userId} = ${eventRosters.userId}
                AND ${orgMemberships.orgId} = (
                  SELECT ${orgEvents.orgId} FROM ${orgEvents}
                  WHERE ${orgEvents.id} = ${eventId}
                )
                AND ${orgMemberships.role} = 'admin'
            )`,
            sql`${users.role} IS DISTINCT FROM 'admin'`
          )
        )
        .orderBy(eventRosters.organization)
    );
  }
}
