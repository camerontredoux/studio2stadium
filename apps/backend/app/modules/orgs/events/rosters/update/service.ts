import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventDancerProfiles, eventRosters } from "#database/schema/org-events";
import { and, eq, ne, sql } from "drizzle-orm";
import type { Validator } from "./validator.ts";
import type { AuditContext } from "#database/audit";

export class RosterActiveReadonlyError extends Error {
  code = "ROSTER_ACTIVE_READONLY" as const;
  constructor() {
    super("Cannot edit an active roster entry.");
    this.name = "RosterActiveReadonlyError";
  }
}

export class RosterEmailConflictError extends Error {
  code = "ROSTER_EMAIL_CONFLICT" as const;
  constructor() {
    super("Another roster entry on this event already uses that email.");
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

export class CoachNoProfileError extends Error {
  code = "COACH_NO_PROFILE" as const;
  constructor() {
    super("Coaches do not have a dancer profile.");
    this.name = "CoachNoProfileError";
  }
}

export class RosterNotFoundError extends Error {
  code = "ROSTER_NOT_FOUND" as const;
  constructor() {
    super("Roster entry not found.");
    this.name = "RosterNotFoundError";
  }
}

@inject()
export class UpdateRosterService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    eventId: string,
    rosterId: string,
    input: Validator,
    audit: AuditContext
  ) {
    return this.db.withAudit(audit, async (tx, auditLog) => {
      const [row] = await tx
        .select()
        .from(eventRosters)
        .where(
          and(eq(eventRosters.id, rosterId), eq(eventRosters.eventId, eventId))
        )
        .for("update");

      if (!row) {
        throw new RosterNotFoundError();
      }

      // Registered entries are owned by the dancer's own profile, so admins
      // may only adjust the bib number (event roster metadata). Any attempt to
      // edit the other fields is rejected.
      if (row.userId !== null) {
        const editsLockedFields =
          input.firstName !== undefined ||
          input.lastName !== undefined ||
          input.email !== undefined ||
          input.organization !== undefined ||
          input.profile !== undefined;
        if (editsLockedFields) {
          throw new RosterActiveReadonlyError();
        }
      }

      if (row.type === "coach" && input.profile !== undefined) {
        throw new CoachNoProfileError();
      }

      // Pre-check email uniqueness within the event
      if (input.email !== undefined && input.email !== row.email) {
        const [collision] = await tx
          .select({ id: eventRosters.id })
          .from(eventRosters)
          .where(
            and(
              eq(eventRosters.eventId, eventId),
              eq(eventRosters.email, input.email),
              ne(eventRosters.id, rosterId)
            )
          );
        if (collision) throw new RosterEmailConflictError();
      }

      // Pre-check bib uniqueness within the event
      if (
        input.bibNumber !== undefined &&
        input.bibNumber !== null &&
        input.bibNumber !== row.bibNumber
      ) {
        const [collision] = await tx
          .select({ id: eventRosters.id })
          .from(eventRosters)
          .where(
            and(
              eq(eventRosters.eventId, eventId),
              eq(eventRosters.bibNumber, input.bibNumber),
              ne(eventRosters.id, rosterId)
            )
          );
        if (collision) throw new RosterBibConflictError();
      }

      // Build update patch — only fields that were provided
      const rosterPatch: Record<string, unknown> = {};
      if (input.firstName !== undefined)
        rosterPatch.firstName = input.firstName;
      if (input.lastName !== undefined) rosterPatch.lastName = input.lastName;
      if (input.email !== undefined) rosterPatch.email = input.email;
      if (input.organization !== undefined)
        rosterPatch.organization = input.organization;
      if (input.bibNumber !== undefined)
        rosterPatch.bibNumber = input.bibNumber;

      if (Object.keys(rosterPatch).length > 0) {
        await tx
          .update(eventRosters)
          .set(rosterPatch)
          .where(eq(eventRosters.id, rosterId));
      }

      if (input.profile !== undefined && row.type === "dancer") {
        const p = input.profile;
        // INSERT ... ON CONFLICT (rosterId) DO UPDATE
        await tx
          .insert(eventDancerProfiles)
          .values({
            rosterId,
            ...(p.gradYear !== undefined ? { gradYear: p.gradYear } : {}),
            ...(p.gpa !== undefined ? { gpa: p.gpa } : {}),
          })
          .onConflictDoUpdate({
            target: eventDancerProfiles.rosterId,
            set: {
              ...(p.gradYear !== undefined && { gradYear: p.gradYear }),
              ...(p.gpa !== undefined && { gpa: p.gpa }),
            },
          });
      }

      // Log audit entry for the update
      auditLog.log({
        action: "update",
        resource: "roster",
        resourceId: rosterId,
        metadata: {
          before: {
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            organization: row.organization,
            bibNumber: row.bibNumber,
          },
          after: {
            ...(input.firstName !== undefined && {
              firstName: input.firstName,
            }),
            ...(input.lastName !== undefined && { lastName: input.lastName }),
            ...(input.email !== undefined && { email: input.email }),
            ...(input.organization !== undefined && {
              organization: input.organization,
            }),
            ...(input.bibNumber !== undefined && {
              bibNumber: input.bibNumber,
            }),
          },
        },
      });

      // Refetch for response
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
          profilePhotoUrl: eventDancerProfiles.profilePhotoUrl,
          gradYear: eventDancerProfiles.gradYear,
          gpa: eventDancerProfiles.gpa,
          studio: eventDancerProfiles.studio,
          state: eventDancerProfiles.state,
          height: eventDancerProfiles.height,
          danceStyles: eventDancerProfiles.danceStyles,
          bio: eventDancerProfiles.bio,
        })
        .from(eventRosters)
        .leftJoin(
          eventDancerProfiles,
          eq(eventDancerProfiles.rosterId, eventRosters.id)
        )
        .where(eq(eventRosters.id, rosterId));

      return {
        id: updated!.id,
        eventId: updated!.eventId,
        type: updated!.type,
        email: updated!.email,
        firstName: updated!.firstName,
        lastName: updated!.lastName,
        bibNumber: updated!.bibNumber,
        organization: updated!.organization,
        isRegistered: updated!.isRegistered,
        createdAt:
          updated!.createdAt instanceof Date
            ? updated!.createdAt.toISOString()
            : String(updated!.createdAt),
        profile:
          updated!.type === "dancer"
            ? {
                profilePhotoUrl: updated!.profilePhotoUrl,
                gradYear: updated!.gradYear,
                gpa: updated!.gpa,
                studio: updated!.studio,
                state: updated!.state,
                height: updated!.height,
                danceStyles: updated!.danceStyles,
                bio: updated!.bio,
              }
            : null,
      };
    });
  }
}
