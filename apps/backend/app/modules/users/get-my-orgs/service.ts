import { DatabaseService } from "#database/service";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { users } from "#database/schema/users";
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
      const [account] = await db
        .select({
          tier: users.orgAccountTier,
          expiresAt: users.orgAccountTierExpiresAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // Once the advisory window closes the dancer is a plain free user, so the
      // org stops appearing for her. Only a lapsed window hides anything: a
      // dancer still inside hers, and one who never had a tier at all (an unpaid
      // free-tier attendee), both keep seeing the org they are rostered on.
      const dancerAccessExpired = Boolean(
        account?.tier && account.expiresAt && account.expiresAt < new Date()
      );

      const [rosterRows, membershipRows] = await Promise.all([
        db
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
          .orderBy(organizations.id, desc(eventRosters.createdAt)),

        db
          .select({
            id: organizations.id,
            slug: organizations.slug,
            name: organizations.name,
            logoUrl: organizations.logoUrl,
            primaryColor: organizations.primaryColor,
            role: orgMemberships.role,
            type: orgMemberships.type,
          })
          .from(orgMemberships)
          .innerJoin(organizations, eq(organizations.id, orgMemberships.orgId))
          .where(eq(orgMemberships.userId, userId)),
      ]);

      const orgsById = new Map<string, MyOrgEntry>();

      for (const r of membershipRows) {
        orgsById.set(r.id, {
          id: r.id,
          slug: r.slug,
          name: r.name,
          logoUrl: r.logoUrl,
          primaryColor: r.primaryColor,
          role: r.role,
          type: r.type,
        });
      }

      for (const r of rosterRows) {
        const existing = orgsById.get(r.id);
        orgsById.set(r.id, {
          id: r.id,
          slug: r.slug,
          name: r.name,
          logoUrl: r.logoUrl,
          primaryColor: r.primaryColor,
          role:
            existing?.role ??
            (r.membershipRole as "admin" | "member" | null) ??
            null,
          type:
            existing?.type ??
            ((r.membershipType ?? r.rosterType) as "coach" | "dancer"),
        });
      }

      // Coach and admin entries are staff access, unrelated to the dancer tier,
      // so an expired window never hides them.
      return [...orgsById.values()].filter(
        (org) => !(dancerAccessExpired && org.type === "dancer")
      );
    });
  }
}
