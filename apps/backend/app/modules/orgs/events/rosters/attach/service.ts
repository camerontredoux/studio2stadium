// apps/backend/app/modules/orgs/events/rosters/attach/service.ts
import { DatabaseService } from "#database/service";
import {
  dancerInvites,
  orgMemberships,
} from "#database/schema/organizations";
import {
  eventDancerProfiles,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { users } from "#database/schema/users";
import { dancerProfiles } from "#database/schema/dancers";
import { inject } from "@adonisjs/core";
import { and, eq, isNull, ne, sql } from "drizzle-orm";

export class RosterNotFoundError extends Error {
  code = "ROSTER_NOT_FOUND" as const;
  constructor() {
    super("Roster entry not found.");
  }
}

export class UserNotFoundError extends Error {
  code = "USER_NOT_FOUND" as const;
  constructor() {
    super("User not found or is not a dancer account.");
  }
}

export class DuplicateRosterError extends Error {
  code = "DUPLICATE_ROSTER" as const;
  constructor() {
    super("This user already has a roster entry for this event.");
  }
}

@inject()
export class AttachAccountService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async attach(
    eventId: string,
    rosterId: string,
    targetUserId: string,
    actorId: string
  ) {
    // Validate target user exists and is a dancer
    const [targetUser] = await this.db.use((db) =>
      db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(and(eq(users.id, targetUserId), eq(users.type, "dancer")))
        .limit(1)
    );
    if (!targetUser) throw new UserNotFoundError();

    // Check no other roster entry on this event already has this userId
    const [duplicate] = await this.db.use((db) =>
      db
        .select({ id: eventRosters.id })
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.userId, targetUserId),
            ne(eventRosters.id, rosterId)
          )
        )
        .limit(1)
    );
    if (duplicate) throw new DuplicateRosterError();

    return this.db.withAudit({ eventId, actorId }, async (tx, audit) => {
      // Lock and fetch the roster entry
      const [roster] = await tx
        .select()
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.id, rosterId),
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.type, "dancer")
          )
        )
        .for("update");
      if (!roster) throw new RosterNotFoundError();

      const oldEmail = roster.email;

      // Update roster entry with user's data
      await tx
        .update(eventRosters)
        .set({
          userId: targetUserId,
          email: targetUser.email,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
        })
        .where(eq(eventRosters.id, rosterId));

      // Sync dancer profile data into event dancer profile
      const [profile] = await tx
        .select({
          gpa: dancerProfiles.gpa,
          gradYear: dancerProfiles.gradYear,
          studio: dancerProfiles.studio,
          biography: dancerProfiles.biography,
        })
        .from(dancerProfiles)
        .where(eq(dancerProfiles.userId, targetUserId))
        .limit(1);

      if (profile) {
        await tx
          .insert(eventDancerProfiles)
          .values({
            rosterId,
            gpa: profile.gpa,
            gradYear: profile.gradYear,
            studio: profile.studio,
            bio: profile.biography,
          })
          .onConflictDoUpdate({
            target: eventDancerProfiles.rosterId,
            set: {
              gpa: profile.gpa,
              gradYear: profile.gradYear,
              studio: profile.studio,
              bio: profile.biography,
            },
          });
      }

      // Resolve orgId from event
      const [event] = await tx
        .select({
          orgId: orgEvents.orgId,
          endDate: orgEvents.endDate,
        })
        .from(orgEvents)
        .where(eq(orgEvents.id, eventId))
        .limit(1);

      if (event?.orgId) {
        const orgId = event.orgId;

        // Upsert org membership
        await tx
          .insert(orgMemberships)
          .values({
            userId: targetUserId,
            orgId,
            type: "dancer",
            role: "member",
          })
          .onConflictDoNothing({
            target: [orgMemberships.userId, orgMemberships.orgId],
          });

        // Consume pending dancer invites for the old email
        await tx
          .update(dancerInvites)
          .set({ consumedAt: new Date() })
          .where(
            and(
              eq(dancerInvites.orgId, orgId),
              eq(dancerInvites.email, oldEmail),
              isNull(dancerInvites.consumedAt)
            )
          );
      }

      audit.log({
        action: "activate",
        resource: "roster",
        resourceId: rosterId,
        metadata: {
          type: "attach_to_account",
          targetUserId,
          previousEmail: oldEmail,
          newEmail: targetUser.email,
        },
      });

      // Refetch updated roster for response
      const [updated] = await tx
        .select({
          id: eventRosters.id,
          eventId: eventRosters.eventId,
          type: eventRosters.type,
          email: eventRosters.email,
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
          bibNumber: eventRosters.bibNumber,
          organization: eventRosters.organization,
          isRegistered: sql<boolean>`(${eventRosters.userId} IS NOT NULL)`,
          createdAt: eventRosters.createdAt,
        })
        .from(eventRosters)
        .where(eq(eventRosters.id, rosterId));

      return updated;
    });
  }

  async searchDancerUsers(query: string) {
    if (query.length < 2) return [];

    const term = `%${query.toLowerCase()}%`;

    return this.db.use((db) =>
      db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          avatar: users.avatar,
          username: users.username,
        })
        .from(users)
        .where(
          and(
            eq(users.type, "dancer"),
            sql`(lower(${users.email}) like ${term} OR lower(${users.firstName}) like ${term} OR lower(${users.lastName}) like ${term})`
          )
        )
        .limit(20)
    );
  }
}
