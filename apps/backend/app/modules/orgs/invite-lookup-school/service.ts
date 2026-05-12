import { DatabaseService } from "#database/service";
import { schoolInvites } from "#database/schema/schools";
import { organizations } from "#database/schema/organizations";
import { orgEvents } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, eq, gt, isNull } from "drizzle-orm";

export interface InviteLookupResult {
  email: string;
  organization: string | null;
  eventId: string;
  eventName: string;
  orgName: string;
  orgSlug: string;
  brandColor: string | null;
  expiresAt: Date;
}

@inject()
export class InviteLookupSchoolService {
  constructor(private db: DatabaseService) {}

  async execute(token: string): Promise<InviteLookupResult | null> {
    return this.db.use(async (db) => {
      const [row] = await db
        .select({
          email: schoolInvites.email,
          organization: schoolInvites.organization,
          eventId: schoolInvites.eventId,
          expiresAt: schoolInvites.expiresAt,
          eventName: orgEvents.name,
          orgName: organizations.name,
          orgSlug: organizations.slug,
          brandColor: organizations.primaryColor,
        })
        .from(schoolInvites)
        .innerJoin(orgEvents, eq(orgEvents.id, schoolInvites.eventId))
        .innerJoin(organizations, eq(organizations.id, orgEvents.orgId))
        .where(
          and(
            eq(schoolInvites.token, token),
            gt(schoolInvites.expiresAt, new Date()),
            isNull(schoolInvites.consumedAt)
          )
        )
        .limit(1);

      if (!row) return null;
      return row;
    });
  }
}
