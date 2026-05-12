import { DatabaseService } from "#database/service";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, desc, eq } from "drizzle-orm";

export interface MyOrgEntry {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  role: "admin" | "member" | null;
  type: "coach" | "dancer";
}

@inject()
export class GetMyOrgsService {
  constructor(private db: DatabaseService) {}

  async execute(userId: string): Promise<MyOrgEntry[]> {
    return this.db.use(async (db) => {
      const rows = await db
        .selectDistinctOn([organizations.id], {
          id: organizations.id,
          slug: organizations.slug,
          name: organizations.name,
          logoUrl: organizations.logoUrl,
          primaryColor: organizations.primaryColor,
          rosterType: eventRosters.type,
          membershipRole: orgMemberships.role,
          membershipType: orgMemberships.type,
        })
        .from(eventRosters)
        .innerJoin(orgEvents, eq(orgEvents.id, eventRosters.eventId))
        .innerJoin(organizations, eq(organizations.id, orgEvents.orgId))
        .leftJoin(
          orgMemberships,
          and(
            eq(orgMemberships.orgId, organizations.id),
            eq(orgMemberships.userId, userId)
          )
        )
        .where(eq(eventRosters.userId, userId))
        .orderBy(organizations.id, desc(eventRosters.createdAt));

      return rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        logoUrl: r.logoUrl,
        primaryColor: r.primaryColor,
        role: (r.membershipRole as "admin" | "member" | null) ?? null,
        type: (r.membershipType ?? r.rosterType) as "coach" | "dancer",
      }));
    });
  }
}
