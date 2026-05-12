import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters } from "#database/schema/org-events";
import { eventSchoolSelections } from "#database/schema/event-features";
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
            eq(eventRosters.type, "coach")
          )
        )
        .orderBy(eventRosters.organization)
    );
  }
}
