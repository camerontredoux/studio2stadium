import { DatabaseService } from "#database/service";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";

export interface GetOrgResult {
  org: typeof organizations.$inferSelect;
  membership: {
    role: "admin" | "member";
    type: "coach" | "dancer";
  } | null;
  myRoster: {
    id: string;
    eventId: string;
    type: "coach" | "dancer";
  } | null;
}

@inject()
export class GetOrgService {
  constructor(private db: DatabaseService) {}

  async execute(
    slug: string,
    userId?: string | null
  ): Promise<GetOrgResult | null> {
    return this.db.use(async (db) => {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1);
      if (!org) return null;

      let membership: GetOrgResult["membership"] = null;
      let myRoster: GetOrgResult["myRoster"] = null;
      if (userId) {
        const [row] = await db
          .select({
            role: orgMemberships.role,
            type: orgMemberships.type,
          })
          .from(orgMemberships)
          .where(
            and(
              eq(orgMemberships.orgId, org.id),
              eq(orgMemberships.userId, userId)
            )
          )
          .limit(1);
        if (row) {
          membership = {
            role: row.role as "admin" | "member",
            type: row.type as "coach" | "dancer",
          };
        }

        const [activeEvent] = await db
          .select({ id: orgEvents.id })
          .from(orgEvents)
          .where(
            and(eq(orgEvents.orgId, org.id), eq(orgEvents.isActive, true))
          )
          .limit(1);

        if (activeEvent) {
          const [roster] = await db
            .select({
              id: eventRosters.id,
              eventId: eventRosters.eventId,
              type: eventRosters.type,
            })
            .from(eventRosters)
            .where(
              and(
                eq(eventRosters.eventId, activeEvent.id),
                eq(eventRosters.userId, userId)
              )
            )
            .limit(1);
          if (roster) {
            myRoster = {
              id: roster.id,
              eventId: roster.eventId,
              type: roster.type as "coach" | "dancer",
            };
          }
        }
      }

      return { org, membership, myRoster };
    });
  }
}
