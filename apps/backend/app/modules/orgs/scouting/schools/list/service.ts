import type { db as Client } from "#database/connection";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { eventSchoolSelections } from "#database/schema/event-features";
import { orgMemberships } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { imageUrl } from "#utils/image-url";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

export interface SchoolPageQuery {
  page?: number;
  limit?: number;
  search?: string;
}

@inject()
export class ListSchoolsService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  /** Every school, for the Coaches page. */
  async execute(
    orgId: string,
    activeEventId: string,
    dancerRosterId: string | null
  ) {
    const rows = await this.db.use((db) => {
      const schools = this.schools(db, orgId, activeEventId, dancerRosterId);
      return db
        .select()
        .from(schools)
        .orderBy(...this.order(schools));
    });
    return rows.map(toSchool);
  }

  /** A page of schools, optionally narrowed by school or coach name. */
  async page(
    orgId: string,
    activeEventId: string,
    dancerRosterId: string | null,
    q: SchoolPageQuery
  ) {
    const page = q.page ?? 0;
    const limit = q.limit ?? 50;

    return this.db.use(async (db) => {
      const schools = this.schools(db, orgId, activeEventId, dancerRosterId);
      let filter: SQL | undefined;
      if (q.search) {
        const pattern = `%${q.search}%`;
        filter = or(
          ilike(schools.organization, pattern),
          sql`concat_ws(' ', ${schools.firstName}, ${schools.lastName}) ILIKE ${pattern}`
        );
      }
      const [rows, totalRow] = await Promise.all([
        db
          .select()
          .from(schools)
          .where(filter)
          .orderBy(...this.order(schools))
          .limit(limit)
          .offset(page * limit),
        db.select({ v: count() }).from(schools).where(filter),
      ]);
      return {
        data: rows.map(toSchool),
        total: Number(totalRow[0]?.v ?? 0),
      };
    });
  }

  /**
   * One coach roster row per school across every event the org has run.
   *
   * The same school can hold a roster row on several of the org's events.
   * Collapse to one row per school, keyed by the coach's account when claimed,
   * otherwise the program name, preferring the active event's row so existing
   * star selections stay wired to the displayed roster, then the newest.
   */
  private schools(
    db: typeof Client,
    orgId: string,
    activeEventId: string,
    dancerRosterId: string | null
  ) {
    const schoolKey = sql`coalesce(
      ${eventRosters.userId}::text,
      'org:' || lower(${eventRosters.organization}),
      ${eventRosters.id}::text
    )`;

    // A school is "starred" for the viewing dancer if a selection exists for
    // this coach roster on the org's active event (where selections are made).
    const isTopSchool = dancerRosterId
      ? sql<boolean>`EXISTS (
          SELECT 1 FROM ${eventSchoolSelections}
          WHERE ${eventSchoolSelections.coachRosterId} = ${eventRosters.id}
            AND ${eventSchoolSelections.dancerRosterId} = ${dancerRosterId}
            AND ${eventSchoolSelections.eventId} = ${activeEventId}
        )`
      : sql<boolean>`false`;

    return db
      .selectDistinctOn([schoolKey], {
        rosterId: eventRosters.id,
        organization: eventRosters.organization,
        firstName: eventRosters.firstName,
        lastName: eventRosters.lastName,
        username: users.username,
        avatar: users.avatar,
        isTopSchool: isTopSchool.as("is_top_school"),
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
      .orderBy(
        schoolKey,
        desc(sql`${eventRosters.eventId} = ${activeEventId}`),
        sql`${eventRosters.createdAt} DESC NULLS LAST`,
        asc(eventRosters.id)
      )
      .as("schools");
  }

  /** By school name, then id, so offset pages never repeat or skip a school. */
  private order(schools: ReturnType<ListSchoolsService["schools"]>) {
    return [
      sql`lower(${schools.organization}) ASC NULLS LAST`,
      asc(schools.rosterId),
    ];
  }
}

function toSchool(row: {
  rosterId: string;
  organization: string | null;
  firstName: string;
  lastName: string;
  username: string | null;
  avatar: string | null;
  isTopSchool: boolean;
}) {
  return {
    rosterId: row.rosterId,
    organization: row.organization,
    firstName: row.firstName,
    lastName: row.lastName,
    username: row.username,
    avatarUrl: imageUrl(row.avatar, "avatar"),
    isTopSchool: row.isTopSchool,
  };
}
