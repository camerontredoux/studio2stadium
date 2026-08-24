// apps/backend/app/modules/orgs/events/rosters/attach/service.ts
import { DatabaseService } from "#database/service";
import { dancerInvites, orgMemberships } from "#database/schema/organizations";
import {
  eventDancerProfiles,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { users } from "#database/schema/users";
import { dancerProfiles } from "#database/schema/dancers";
import {
  grantOrgAccountTier,
  type GrantedOrgTier,
} from "#shared/org/grant-account-tier";
import { inject } from "@adonisjs/core";
import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { nonOrganizerMembershipConflict } from "#shared/org/membership";

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

/**
 * Raised when the roster entry is already claimed by a *different* account.
 *
 * Relinking rewrites the entry's userId, email and name in place, which
 * silently unregisters whoever held it — they lose the event from their
 * profile and can no longer see their callbacks. That is recoverable only if
 * someone noticed, so it has to be an explicit decision rather than a
 * side effect of picking a name out of a search box. The caller re-sends the
 * request with `confirmRelink` once a human has seen who they are displacing.
 */
export class RosterAlreadyLinkedError extends Error {
  code = "ROSTER_ALREADY_LINKED" as const;
  constructor(
    readonly currentUser: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    }
  ) {
    super(
      "This roster entry is already linked to a different account. Confirm the change to reassign it."
    );
  }
}

@inject()
export class AttachAccountService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async attach(
    eventId: string,
    rosterId: string,
    targetUserId: string,
    actorId: string,
    confirmRelink = false
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
      const oldFirstName = roster.firstName;
      const oldLastName = roster.lastName;
      const previousUserId = roster.userId;
      const isRelink = previousUserId !== null && previousUserId !== targetUserId;

      // Reassigning a claimed entry unregisters its current holder, so it takes
      // a deliberate confirmation. Re-running an attach for the account that
      // already holds it stays a no-op and needs no gate.
      if (isRelink && !confirmRelink) {
        const [currentUser] = await tx
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .where(eq(users.id, previousUserId))
          .limit(1);

        throw new RosterAlreadyLinkedError(
          currentUser ?? {
            id: previousUserId,
            email: oldEmail,
            firstName: oldFirstName,
            lastName: oldLastName,
          }
        );
      }

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

      let tierGranted: GrantedOrgTier | null = null;

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
          .onConflictDoNothing(nonOrganizerMembershipConflict());

        // Bring the account's advisory window up to what this roster entitles
        // it to: granted outright if it had no tier, extended if this event runs
        // later than whatever it already had. Runs after the roster update above
        // so the row this reads already carries `userId`.
        tierGranted = await grantOrgAccountTier(tx, {
          userId: targetUserId,
          orgId,
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
          previousUserId,
          // A relink reassigns the entry away from a real account; a plain
          // attach claims a pending row. They read very differently when
          // someone is reconstructing what happened to a dancer.
          relinked: isRelink,
          confirmed: isRelink ? confirmRelink : null,
          // The full before-state. Recording only the email here used to make
          // a reassignment unreconstructable: the entry's name was overwritten
          // in place and the original was lost with it.
          before: {
            userId: previousUserId,
            email: oldEmail,
            firstName: oldFirstName,
            lastName: oldLastName,
          },
          after: {
            userId: targetUserId,
            email: targetUser.email,
            firstName: targetUser.firstName,
            lastName: targetUser.lastName,
          },
          diff: {
            userId: { from: previousUserId, to: targetUserId },
            email: { from: oldEmail, to: targetUser.email },
            firstName: { from: oldFirstName, to: targetUser.firstName },
            lastName: { from: oldLastName, to: targetUser.lastName },
          },
          // Retained so entries written before the richer shape landed stay
          // comparable with new ones.
          previousEmail: oldEmail,
          newEmail: targetUser.email,
          tierGranted: tierGranted?.tier ?? null,
          tierExpiresAt: tierGranted?.expiresAt ?? null,
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
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    // "Lucy Wil" spans two columns, so matching the raw query against each
    // column on its own finds nothing. Every whitespace-separated token has to
    // match somewhere — the joined full name included — which keeps typing
    // more of a name narrowing the list instead of emptying it.
    const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
    const fullName = sql`lower(coalesce(${users.firstName}, '') || ' ' || coalesce(${users.lastName}, ''))`;

    const matchesToken = tokens.map((token) => {
      const term = `%${token}%`;
      return sql`(lower(${users.email}) like ${term} OR ${fullName} like ${term})`;
    });

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
        .where(and(eq(users.type, "dancer"), ...matchesToken))
        // The limit truncates, so order it: names that start with the query
        // come first, then alphabetically, so the list stays stable as the
        // admin keeps typing.
        .orderBy(
          sql`case when ${fullName} like ${`${trimmed.toLowerCase()}%`} then 0 else 1 end`,
          sql`${fullName}`,
          users.email
        )
        .limit(20)
    );
  }
}
