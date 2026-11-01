import { DatabaseService } from "#database/service";
import { schoolInvites } from "#database/schema/schools";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { orgMemberships, organizations } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { inject } from "@adonisjs/core";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  notExists,
  or,
  sql,
} from "drizzle-orm";
import { sendSchoolAccountInviteEmail } from "#shared/org/school-account-invite-email";
import { rosterTypeMembershipConflict } from "#shared/org/membership";
import type { InvitesValidator, OrphansValidator } from "./validator.ts";

@inject()
export class ReconciliationService {
  constructor(private db: DatabaseService) {}

  /** One page of the event's invites, claimed or not, newest first. */
  async listInvites(eventId: string, q: InvitesValidator) {
    const page = q.page ?? 0;
    const limit = q.limit ?? 50;
    const where = and(
      eq(schoolInvites.eventId, eventId),
      q.claimed
        ? isNotNull(schoolInvites.consumedAt)
        : isNull(schoolInvites.consumedAt),
      q.search
        ? or(
            ilike(schoolInvites.email, `%${q.search}%`),
            ilike(schoolInvites.organization, `%${q.search}%`)
          )
        : undefined
    );
    const [data, [{ total }]] = await Promise.all([
      this.db.use((db) =>
        db
          .select({
            id: schoolInvites.id,
            email: schoolInvites.email,
            organization: schoolInvites.organization,
            expiresAt: schoolInvites.expiresAt,
            consumedAt: schoolInvites.consumedAt,
            createdAt: schoolInvites.createdAt,
          })
          .from(schoolInvites)
          .where(where)
          .orderBy(desc(schoolInvites.createdAt), desc(schoolInvites.id))
          .limit(limit)
          .offset(page * limit)
      ),
      this.db.use((db) =>
        db.select({ total: count() }).from(schoolInvites).where(where)
      ),
    ]);
    return { data, total };
  }

  /** One page of the event's coach rows with no account and no invite. */
  async listOrphans(eventId: string, q: OrphansValidator) {
    const page = q.page ?? 0;
    const limit = q.limit ?? 50;
    const pattern = q.search ? `%${q.search}%` : undefined;
    const where = and(
      this.orphanFilter(eventId),
      pattern
        ? or(
            ilike(
              sql`${eventRosters.firstName} || ' ' || ${eventRosters.lastName}`,
              pattern
            ),
            ilike(eventRosters.email, pattern),
            ilike(eventRosters.organization, pattern)
          )
        : undefined
    );
    const [data, [{ total }]] = await Promise.all([
      this.db.use((db) =>
        db
          .select({
            id: eventRosters.id,
            email: eventRosters.email,
            firstName: eventRosters.firstName,
            lastName: eventRosters.lastName,
            organization: eventRosters.organization,
          })
          .from(eventRosters)
          .where(where)
          .orderBy(
            asc(eventRosters.lastName),
            asc(eventRosters.firstName),
            asc(eventRosters.id)
          )
          .limit(limit)
          .offset(page * limit)
      ),
      this.db.use((db) =>
        db.select({ total: count() }).from(eventRosters).where(where)
      ),
    ]);
    return { data, total };
  }

  /** How many invites and orphan rows each list holds. */
  async counts(eventId: string) {
    const [[invites], [orphans]] = await Promise.all([
      this.db.use((db) =>
        db
          .select({
            unclaimed:
              sql<number>`count(*) filter (where ${schoolInvites.consumedAt} is null)`.mapWith(
                Number
              ),
            claimed: sql<number>`count(${schoolInvites.consumedAt})`.mapWith(
              Number
            ),
          })
          .from(schoolInvites)
          .where(eq(schoolInvites.eventId, eventId))
      ),
      this.db.use((db) =>
        db
          .select({ total: count() })
          .from(eventRosters)
          .where(this.orphanFilter(eventId))
      ),
    ]);
    return {
      unclaimed: invites?.unclaimed ?? 0,
      claimed: invites?.claimed ?? 0,
      orphans: orphans?.total ?? 0,
    };
  }

  /** A coach row with no account whose email no invite went to. */
  private orphanFilter(eventId: string) {
    return and(
      eq(eventRosters.eventId, eventId),
      eq(eventRosters.type, "coach"),
      isNull(eventRosters.userId),
      notExists(
        sql`(select 1 from ${schoolInvites}
          where ${schoolInvites.eventId} = ${eventId}
            and ${schoolInvites.email} = ${eventRosters.email})`
      )
    );
  }

  async resendInvite(inviteId: string, eventId: string, orgSlug: string) {
    const [invite] = await this.db.use((db) =>
      db
        .select()
        .from(schoolInvites)
        .where(
          and(
            eq(schoolInvites.id, inviteId),
            eq(schoolInvites.eventId, eventId)
          )
        )
        .limit(1)
    );
    if (!invite) return { notFound: true } as const;

    // An already-claimed invite must never be re-emailed — the coach has already
    // registered. the claimed list still shows consumed invites (with a badge),
    // so the resend action can reach this path; treat it as a no-op.
    if (invite.consumedAt) return { alreadyClaimed: true } as const;

    // Stable resend: reuse the existing token so previously emailed links stay
    // valid, extend expiry without ever shortening it, and never reset
    // consumedAt (an already-claimed invite must not be reopened).
    const token = invite.token;
    const resendExpiry = new Date(Date.now() + 14 * 86400000);
    const expiresAt =
      invite.expiresAt > resendExpiry ? invite.expiresAt : resendExpiry;
    await this.db.use((db) =>
      db
        .update(schoolInvites)
        .set({ expiresAt })
        .where(eq(schoolInvites.id, inviteId))
    );

    const [org] = await this.db.use((db) =>
      db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, orgSlug))
        .limit(1)
    );

    if (org) {
      sendSchoolAccountInviteEmail({
        org,
        email: invite.email,
        firstName: invite.email.split("@")[0] ?? "Coach",
        token,
      }).catch(() => {});
    }

    return { resent: true } as const;
  }

  async revokeInvite(inviteId: string, eventId: string) {
    const result = await this.db.use((db) =>
      db
        .delete(schoolInvites)
        .where(
          and(
            eq(schoolInvites.id, inviteId),
            eq(schoolInvites.eventId, eventId)
          )
        )
        .returning({ id: schoolInvites.id })
    );
    return result.length > 0
      ? ({ revoked: true } as const)
      : ({ notFound: true } as const);
  }

  async manualMerge(
    eventId: string,
    rosterId: string,
    targetUserId: string,
    actorId: string
  ) {
    return this.db.withAudit({ eventId, actorId }, async (tx, audit) => {
      const [roster] = await tx
        .select()
        .from(eventRosters)
        .where(and(eq(eventRosters.id, rosterId), isNull(eventRosters.userId)))
        .limit(1);
      if (!roster) return { notFound: true } as const;

      await tx
        .update(eventRosters)
        .set({ userId: targetUserId })
        .where(eq(eventRosters.id, rosterId));

      // Resolve the orgId from the event
      const [eventRow] = await tx
        .select({ orgId: orgEvents.orgId })
        .from(orgEvents)
        .where(eq(orgEvents.id, eventId))
        .limit(1);

      if (eventRow?.orgId) {
        const orgId = eventRow.orgId;
        await tx
          .insert(orgMemberships)
          .values({
            userId: targetUserId,
            orgId,
            type: "coach",
            role: "member",
          })
          .onConflictDoNothing(rosterTypeMembershipConflict());
      }

      // Mark matching unconsumed invite consumed
      await tx
        .update(schoolInvites)
        .set({ consumedAt: new Date() })
        .where(
          and(
            eq(schoolInvites.eventId, eventId),
            eq(schoolInvites.email, roster.email),
            isNull(schoolInvites.consumedAt)
          )
        );

      audit.log({
        action: "activate",
        resource: "roster",
        resourceId: rosterId,
        metadata: {
          type: "csv_upload_manual_merge",
          targetUserId,
          rosterEmail: roster.email,
        },
      });

      return { merged: true } as const;
    });
  }

  async searchSchoolUsers(query: string) {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    // A query like "Jane Wil" spans two columns, so matching it against each
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
        })
        .from(users)
        .where(and(eq(users.type, "school"), ...matchesToken))
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
