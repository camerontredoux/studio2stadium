import { DatabaseService } from "#database/service";
import {
  schoolProfiles,
  schoolInvites,
  suggestedClaimDismissals,
} from "#database/schema/schools";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { orgMemberships } from "#database/schema/organizations";
import { inject } from "@adonisjs/core";
import { and, eq, isNull, notInArray, sql } from "drizzle-orm";
import { rosterTypeMembershipConflict } from "#shared/org/membership";

@inject()
export class PendingClaimsService {
  constructor(private db: DatabaseService) {}

  async list(userId: string) {
    const [profile] = await this.db.use((db) =>
      db
        .select({ id: schoolProfiles.id, name: schoolProfiles.name })
        .from(schoolProfiles)
        .where(eq(schoolProfiles.userId, userId))
        .limit(1)
    );
    if (!profile) return { schoolName: null, claims: [] };

    const dismissed = await this.db.use((db) =>
      db
        .select({ rosterId: suggestedClaimDismissals.rosterId })
        .from(suggestedClaimDismissals)
        .where(eq(suggestedClaimDismissals.userId, userId))
    );
    const dismissedIds = dismissed.map((d) => d.rosterId);

    const baseCondition = and(
      eq(eventRosters.type, "coach"),
      isNull(eventRosters.userId),
      sql`lower(${eventRosters.organization}) = lower(${profile.name})`,
      dismissedIds.length > 0
        ? notInArray(eventRosters.id, dismissedIds)
        : undefined
    );

    const claims = await this.db.use((db) =>
      db
        .select({
          rosterId: eventRosters.id,
          email: eventRosters.email,
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
          organization: eventRosters.organization,
          eventId: eventRosters.eventId,
          eventName: orgEvents.name,
        })
        .from(eventRosters)
        .innerJoin(orgEvents, eq(orgEvents.id, eventRosters.eventId))
        .where(baseCondition)
    );

    return { schoolName: profile.name, claims };
  }

  async claim(userId: string, rosterId: string) {
    return this.db.tx(async (tx) => {
      const [roster] = await tx
        .select()
        .from(eventRosters)
        .where(and(eq(eventRosters.id, rosterId), isNull(eventRosters.userId)))
        .limit(1);

      if (!roster) {
        return { notFound: true } as const;
      }

      await tx
        .update(eventRosters)
        .set({ userId })
        .where(eq(eventRosters.id, rosterId));

      const [event] = await tx
        .select({ orgId: orgEvents.orgId })
        .from(orgEvents)
        .where(eq(orgEvents.id, roster.eventId))
        .limit(1);

      if (event) {
        await tx
          .insert(orgMemberships)
          .values({ userId, orgId: event.orgId, type: "coach", role: "member" })
          .onConflictDoNothing(rosterTypeMembershipConflict());
      }

      await tx
        .update(schoolInvites)
        .set({ consumedAt: new Date() })
        .where(
          and(
            eq(schoolInvites.eventId, roster.eventId),
            eq(schoolInvites.email, roster.email),
            isNull(schoolInvites.consumedAt)
          )
        );

      return { claimed: true } as const;
    });
  }

  async dismiss(userId: string, rosterId: string) {
    await this.db.use((db) =>
      db
        .insert(suggestedClaimDismissals)
        .values({ userId, rosterId })
        .onConflictDoNothing({
          target: [
            suggestedClaimDismissals.userId,
            suggestedClaimDismissals.rosterId,
          ],
        })
    );
  }
}
