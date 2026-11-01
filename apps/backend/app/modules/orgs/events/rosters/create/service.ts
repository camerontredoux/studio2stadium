import { DatabaseService, type Transaction } from "#database/service";
import { inject } from "@adonisjs/core";
import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import logger from "@adonisjs/core/services/logger";
import { users } from "#database/schema/users";
import { dancerProfiles } from "#database/schema/dancers";
import { schoolInvites, schoolProfiles } from "#database/schema/schools";
import {
  dancerInvites,
  organizations,
  orgMemberships,
} from "#database/schema/organizations";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import type { AuditContext } from "#database/audit";
import { normalizeEmail } from "#utils/normalize-email";
import { tierExpiryFrom } from "#utils/event-time";
import { enforceEmailRole } from "#shared/org/role-guard";
import { grantOrgAccountTier } from "#shared/org/grant-account-tier";
import { rosterTypeMembershipConflict } from "#shared/org/membership";
import { schoolInviteExpiry } from "#shared/org/school-invite-expiry";
import { sendOrgInviteEmail } from "#shared/org/invite-email";
import { sendFreeTierInviteEmail } from "#shared/org/free-tier-invite-email";
import { sendOrgRosterAddedEmail } from "#shared/org/roster-added-email";
import { sendSchoolAccountInviteEmail } from "#shared/org/school-account-invite-email";
import type { Validator } from "./validator.ts";

export class EventNotFoundError extends Error {
  code = "EVENT_NOT_FOUND" as const;
  constructor() {
    super("Event not found.");
    this.name = "EventNotFoundError";
  }
}

/** A column the CSV upload requires for this type was left out. */
export class RosterFieldRequiredError extends Error {
  code = "ROSTER_FIELD_REQUIRED" as const;
  constructor(readonly field: "bibNumber" | "organization" | "paid") {
    super(`${field} is required.`);
    this.name = "RosterFieldRequiredError";
  }
}

export class RosterEmailConflictError extends Error {
  code = "ROSTER_EMAIL_CONFLICT" as const;
  constructor() {
    super("This email is already on the roster for this event.");
    this.name = "RosterEmailConflictError";
  }
}

export class RosterBibConflictError extends Error {
  code = "ROSTER_BIB_CONFLICT" as const;
  constructor() {
    super("Another roster entry on this event already uses that bib number.");
    this.name = "RosterBibConflictError";
  }
}

export class RosterAccountTakenError extends Error {
  code = "ROSTER_ACCOUNT_TAKEN" as const;
  constructor() {
    super("This account is already on the roster for this event.");
    this.name = "RosterAccountTakenError";
  }
}

export class AccountNotFoundError extends Error {
  code = "ACCOUNT_NOT_FOUND" as const;
  constructor(type: "dancer" | "coach") {
    super(
      type === "dancer"
        ? "Account not found or is not a dancer account."
        : "Account not found or is not a school account."
    );
    this.name = "AccountNotFoundError";
  }
}

/** Same guard as the uploads: dancers and coaches can't share an email. */
export class RosterRoleConflictError extends Error {
  code = "ROSTER_ROLE_CONFLICT" as const;
  constructor(type: "dancer" | "coach") {
    super(
      type === "dancer"
        ? "This email belongs to a school account. Add it as a coach instead."
        : "This email belongs to a dancer account. Add it as a dancer instead."
    );
    this.name = "RosterRoleConflictError";
  }
}

type EmailTask =
  | { kind: "dancer-invite"; token: string; paid: boolean | undefined }
  | { kind: "coach-invite"; token: string }
  | { kind: "added" };

/**
 * Adds one Roster Entry by hand. It writes the same rows a one-line CSV upload
 * writes: the entry, then either the account's org membership (and, for a
 * dancer, its tier) or a pending invite, and sends the same email. A new email
 * only: unlike an upload it never overwrites an entry already on the roster.
 */
@inject()
export class CreateRosterService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    orgId: string,
    eventId: string,
    input: Validator,
    audit: AuditContext
  ) {
    const { type } = input;

    // The admin routes don't tie :id to the org, so check it here.
    const [event] = await this.db.use((db) =>
      db
        .select()
        .from(orgEvents)
        .where(and(eq(orgEvents.id, eventId), eq(orgEvents.orgId, orgId)))
    );
    if (!event) throw new EventNotFoundError();

    const [org] = await this.db.use((db) =>
      db.select().from(organizations).where(eq(organizations.id, orgId))
    );
    const orgFeatures =
      (org?.features as Record<string, unknown> | undefined) ?? {};
    const orgSettings =
      (org?.settings as Record<string, unknown> | undefined) ?? {};
    const freeTier = type === "dancer" && Boolean(orgFeatures.freeTierUsers);
    const tierExpiryMonths =
      Number(orgSettings.tierExpiryMonths ?? orgFeatures.tierExpiryMonths) || 3;

    if (type === "dancer" && input.bibNumber === undefined) {
      throw new RosterFieldRequiredError("bibNumber");
    }
    if (type === "coach" && !input.organization) {
      throw new RosterFieldRequiredError("organization");
    }
    if (freeTier && input.paid === undefined) {
      throw new RosterFieldRequiredError("paid");
    }
    const bibNumber = type === "dancer" ? input.bibNumber! : null;
    const organization = type === "coach" ? input.organization! : null;
    const paid = freeTier ? input.paid : undefined;

    // A linked account brings its own email. Otherwise match the email the way
    // the upload does: only an account with a profile of this type.
    let email: string;
    let userId: string | null;
    if (input.userId) {
      const [account] = await this.db.use((db) =>
        db
          .select({ id: users.id, email: users.email })
          .from(users)
          .where(
            and(
              eq(users.id, input.userId!),
              eq(users.type, type === "dancer" ? "dancer" : "school")
            )
          )
          .limit(1)
      );
      if (!account) throw new AccountNotFoundError(type);
      email = account.email;
      userId = account.id;
    } else {
      email = await normalizeEmail(input.email);
      const profiles = type === "dancer" ? dancerProfiles : schoolProfiles;
      const [match] = await this.db.use((db) =>
        db
          .select({ id: users.id })
          .from(users)
          .innerJoin(profiles, eq(profiles.userId, users.id))
          .where(eq(users.email, email))
          .limit(1)
      );
      userId = match?.id ?? null;
    }

    const conflicts = await this.db.use((db) =>
      enforceEmailRole(db, [email], type)
    );
    if (conflicts.length > 0) throw new RosterRoleConflictError(type);

    const { entry, emailTask } = await this.db.withAudit(
      audit,
      async (tx, auditLog) => {
        const [sameEmail] = await tx
          .select({ id: eventRosters.id })
          .from(eventRosters)
          .where(
            and(
              eq(eventRosters.eventId, eventId),
              eq(eventRosters.email, email)
            )
          )
          .limit(1);
        if (sameEmail) throw new RosterEmailConflictError();

        if (userId) {
          const [sameAccount] = await tx
            .select({ id: eventRosters.id })
            .from(eventRosters)
            .where(
              and(
                eq(eventRosters.eventId, eventId),
                eq(eventRosters.userId, userId)
              )
            )
            .limit(1);
          if (sameAccount) throw new RosterAccountTakenError();
        }

        if (bibNumber !== null) {
          const [sameBib] = await tx
            .select({ id: eventRosters.id })
            .from(eventRosters)
            .where(
              and(
                eq(eventRosters.eventId, eventId),
                eq(eventRosters.bibNumber, bibNumber)
              )
            )
            .limit(1);
          if (sameBib) throw new RosterBibConflictError();
        }

        const [inserted] = await tx
          .insert(eventRosters)
          .values({
            eventId,
            type,
            email,
            firstName: input.firstName,
            lastName: input.lastName,
            bibNumber,
            organization,
            paid,
            userId,
            expirationDate:
              userId && type === "dancer"
                ? tierExpiryFrom(event.endDate, tierExpiryMonths)
                    .toISOString()
                    .slice(0, 10)
                : null,
          })
          .returning();

        let task: EmailTask | null;
        if (userId) {
          await tx
            .insert(orgMemberships)
            .values({ userId, orgId, type, role: "member" })
            .onConflictDoNothing(rosterTypeMembershipConflict());
          if (type === "dancer") {
            await grantOrgAccountTier(tx, { userId, orgId });
          }
          task = { kind: "added" };
        } else if (type === "dancer") {
          task = await mintDancerInvite(tx, orgId, email, paid);
        } else {
          task = await mintCoachInvite(
            tx,
            eventId,
            email,
            organization,
            event.startDate
          );
        }

        auditLog.log({
          action: "create",
          resource: "roster",
          resourceId: inserted!.id,
          metadata: {
            type,
            email,
            firstName: input.firstName,
            lastName: input.lastName,
            bibNumber,
            organization,
            paid: paid ?? null,
            userId,
          },
        });

        return { entry: inserted!, emailTask: task };
      }
    );

    if (org && emailTask) {
      const send = () => {
        const base = {
          org,
          event,
          email,
          firstName: entry.firstName,
        };
        if (emailTask.kind === "added") {
          return sendOrgRosterAddedEmail({ ...base, type });
        }
        if (emailTask.kind === "coach-invite") {
          return sendSchoolAccountInviteEmail({
            ...base,
            token: emailTask.token,
          });
        }
        const upgradeUrl = orgSettings.free_tier_upgrade_url as
          | string
          | undefined;
        if (freeTier && emailTask.paid === false && upgradeUrl) {
          return sendFreeTierInviteEmail({
            ...base,
            token: emailTask.token,
            upgradeUrl,
            tierExpiryMonths,
          });
        }
        return sendOrgInviteEmail({
          ...base,
          type: "dancer",
          token: emailTask.token,
        });
      };
      // Keep the response immediate; the helpers swallow send failures.
      void send().catch((error: unknown) => {
        logger.error({ orgId, eventId, err: error }, "Roster add email failed");
      });
    }

    return {
      id: entry.id,
      eventId: entry.eventId,
      type: entry.type,
      email: entry.email,
      firstName: entry.firstName,
      lastName: entry.lastName,
      bibNumber: entry.bibNumber,
      organization: entry.organization,
      isRegistered: entry.userId !== null,
      createdAt: entry.createdAt,
    };
  }
}

/**
 * Reuses an existing invite's token so links already emailed keep working,
 * and never reopens one that was claimed (mirrors the dancer upload).
 */
async function mintDancerInvite(
  tx: Transaction,
  orgId: string,
  email: string,
  paid: boolean | undefined
): Promise<EmailTask | null> {
  const inviteExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  const [existing] = await tx
    .select()
    .from(dancerInvites)
    .where(and(eq(dancerInvites.orgId, orgId), eq(dancerInvites.email, email)))
    .limit(1);
  if (!existing) {
    const token = randomBytes(32).toString("base64url");
    await tx
      .insert(dancerInvites)
      .values({ orgId, email, token, expiresAt: inviteExpiry });
    return { kind: "dancer-invite", token, paid };
  }
  await tx
    .update(dancerInvites)
    .set({
      expiresAt:
        existing.expiresAt > inviteExpiry ? existing.expiresAt : inviteExpiry,
    })
    .where(eq(dancerInvites.id, existing.id));
  return existing.consumedAt === null
    ? { kind: "dancer-invite", token: existing.token, paid }
    : null;
}

/** One school invite per (event, email); a repeat extends it (mirrors the coach upload). */
async function mintCoachInvite(
  tx: Transaction,
  eventId: string,
  email: string,
  organization: string | null,
  eventStartDate: string | null
): Promise<EmailTask | null> {
  const [invite] = await tx
    .insert(schoolInvites)
    .values({
      eventId,
      email,
      organization,
      token: randomBytes(32).toString("hex"),
      expiresAt: schoolInviteExpiry(eventStartDate),
    })
    .onConflictDoUpdate({
      target: [schoolInvites.eventId, schoolInvites.email],
      set: {
        expiresAt: sql`greatest(${schoolInvites.expiresAt}, excluded.expires_at)`,
      },
    })
    .returning({
      token: schoolInvites.token,
      consumedAt: schoolInvites.consumedAt,
    });
  return invite && invite.consumedAt === null
    ? { kind: "coach-invite", token: invite.token }
    : null;
}
