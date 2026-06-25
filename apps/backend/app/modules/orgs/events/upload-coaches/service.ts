import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { users } from "#database/schema/users";
import { schoolProfiles, schoolInvites } from "#database/schema/schools";
import {
  eventRosters,
  csvUploads,
  orgEvents,
} from "#database/schema/org-events";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { normalizeRowEmails, parseCoachCsv } from "#shared/org/csv-parser";
import { sendOrgRosterAddedEmail } from "#shared/org/roster-added-email";
import { sendSchoolAccountInviteEmail } from "#shared/org/school-account-invite-email";
import { enforceEmailRole } from "#shared/org/role-guard";
import { verifyPreviewToken } from "#shared/org/preview-token";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { randomBytes } from "node:crypto";

@inject()
export class UploadCoachesService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute({
    orgId,
    eventId,
    uploaderId,
    fileUrl,
    csv,
    previewToken,
  }: {
    orgId: string;
    eventId: string;
    uploaderId: string;
    fileUrl: string;
    csv: string;
    previewToken?: string;
  }) {
    // Mandatory preview gate — reject if token missing or expired
    if (previewToken) {
      const tokenResult = verifyPreviewToken(previewToken, eventId, "coach");
      if (!tokenResult.ok) {
        return {
          preconditionFailed: true,
          message:
            tokenResult.reason === "expired"
              ? "Preview expired — please re-upload the file to get a fresh preview"
              : "Invalid preview token — please re-upload the file",
          reason: tokenResult.reason,
        } as const;
      }
    }

    const parsed = parseCoachCsv(csv);
    const errors = parsed.errors;
    const parsedRows = await normalizeRowEmails(parsed.rows);

    // Dancer accounts cannot be added as coaches.
    const roleErrors: Array<{ row: number; reason: string }> = [];
    let rows = parsedRows;
    if (parsedRows.length > 0) {
      const emails = parsedRows.map((r) => r.email);
      const conflicts = await this.db.use((db) =>
        enforceEmailRole(db, emails, "coach")
      );
      const conflictSet = new Set(conflicts.map((c) => c.email.toLowerCase()));
      if (conflictSet.size > 0) {
        rows = parsedRows.filter(
          (r) => !conflictSet.has(r.email.toLowerCase())
        );
        for (const r of parsedRows) {
          if (conflictSet.has(r.email.toLowerCase())) {
            roleErrors.push({
              row: r.csvRow,
              reason:
                "email belongs to a dancer account — use the dancer roster",
            });
          }
        }
      }
    }
    const allErrors = [...errors, ...roleErrors];

    // Reject commit if any errors detected (defence in depth after preview gate)
    if (allErrors.length > 0) {
      return {
        preconditionFailed: true,
        message: `${allErrors.length} row${allErrors.length === 1 ? "" : "s"} rejected — ${allErrors[0]!.reason}`,
        reason: "errors_present",
        errors: allErrors,
      } as const;
    }

    const [org] = await this.db.use((db) =>
      db.select().from(organizations).where(eq(organizations.id, orgId))
    );

    const [event] = await this.db.use((db) =>
      db.select().from(orgEvents).where(eq(orgEvents.id, eventId))
    );

    // Track matched-new rows (registered coach added to a roster for the
    // first time) for fire-and-forget notification emails after transaction.
    const matchedNotifications: { email: string; firstName: string }[] = [];

    const result = await this.db.withAudit(
      { eventId, actorId: uploaderId },
      async (tx, audit) => {
        let added = 0;
        let updated = 0;
        let activated = 0;

        if (rows.length > 0) {
          // Batch match users by email (join with schoolProfiles for coaches)
          const emails = rows.map((r) => r.email);
          const matchedUsers = await tx
            .select({ id: users.id, email: users.email })
            .from(users)
            .innerJoin(schoolProfiles, eq(schoolProfiles.userId, users.id))
            .where(inArray(users.email, emails));
          const byEmail = new Map(
            matchedUsers.map((u) => [u.email.toLowerCase(), u.id])
          );

          for (const r of rows) {
            const userId = byEmail.get(r.email.toLowerCase()) ?? null;

            const [existing] = await tx
              .select()
              .from(eventRosters)
              .where(
                and(
                  eq(eventRosters.eventId, eventId),
                  eq(eventRosters.email, r.email)
                )
              )
              .limit(1);

            if (existing) {
              await tx
                .update(eventRosters)
                .set({
                  firstName: r.firstName,
                  lastName: r.lastName,
                  organization: r.organization,
                  userId,
                })
                .where(eq(eventRosters.id, existing.id));
              updated += 1;
            } else {
              await tx
                .insert(eventRosters)
                .values({
                  eventId,
                  type: "coach",
                  email: r.email,
                  firstName: r.firstName,
                  lastName: r.lastName,
                  organization: r.organization,
                  userId,
                })
                .returning();
              added += 1;
              if (userId) {
                activated += 1;
                matchedNotifications.push({
                  email: r.email,
                  firstName: r.firstName,
                });
              }
            }

            if (userId) {
              await tx
                .insert(orgMemberships)
                .values({
                  userId,
                  orgId,
                  type: "coach",
                  role: "member",
                })
                .onConflictDoNothing({
                  target: [orgMemberships.userId, orgMemberships.orgId],
                });
            } else {
              // Mint a school invite for unmatched rows; UPSERT on re-upload
              const token = randomBytes(32).toString("hex");
              const expiresAt = new Date(Date.now() + 14 * 86400000);
              await tx
                .insert(schoolInvites)
                .values({
                  eventId,
                  email: r.email,
                  organization: r.organization ?? null,
                  token,
                  expiresAt,
                })
                .onConflictDoUpdate({
                  target: [schoolInvites.eventId, schoolInvites.email],
                  set: {
                    token,
                    expiresAt,
                    consumedAt: null,
                  },
                });
            }
          }
        }

        // Insert csvUploads after the row loop so counts are authoritative
        const [upload] = await tx
          .insert(csvUploads)
          .values({
            eventId,
            type: "coach",
            fileUrl,
            uploadedBy: uploaderId,
            rowsAdded: added,
            rowsUpdated: updated,
            rowsErrored: 0,
            errorDetails: [] as any,
          })
          .returning();

        // Backfill csvUploadId on all roster rows just inserted/updated
        if (rows.length > 0) {
          const emails = rows.map((r) => r.email);
          await tx
            .update(eventRosters)
            .set({ csvUploadId: upload!.id })
            .where(
              and(
                eq(eventRosters.eventId, eventId),
                inArray(eventRosters.email, emails)
              )
            );
        }

        audit.log({
          action: "upload",
          resource: "csv_upload",
          resourceId: upload!.id,
          metadata: {
            type: "coach",
            rowsAdded: added,
            rowsUpdated: updated,
            rowsErrored: 0,
            rowsActivated: activated,
            rowsPending: added - activated,
          },
        });

        return { uploadId: upload!.id, added, updated, activated };
      }
    );

    // Fire-and-forget token-linked invite emails for unmatched rows (after transaction)
    if (org && rows.length > 0) {
      const uploadId = result.uploadId;
      const unmatchedRows = await this.db
        .use((db) =>
          db
            .select({
              email: eventRosters.email,
              firstName: eventRosters.firstName,
              token: schoolInvites.token,
            })
            .from(eventRosters)
            .leftJoin(
              schoolInvites,
              and(
                eq(schoolInvites.eventId, eventId),
                eq(schoolInvites.email, eventRosters.email),
                isNull(schoolInvites.consumedAt)
              )
            )
            .where(
              and(
                eq(eventRosters.csvUploadId, uploadId),
                isNull(eventRosters.userId)
              )
            )
        )
        .catch(() => []);

      for (const row of unmatchedRows) {
        if (!row.token) continue;
        sendSchoolAccountInviteEmail({
          org,
          event: event ?? null,
          email: row.email,
          firstName: row.firstName,
          token: row.token,
        }).catch(() => {});
      }
    }

    // Fire-and-forget notification emails for matched-new rows.
    if (org && matchedNotifications.length > 0) {
      for (const { email, firstName } of matchedNotifications) {
        sendOrgRosterAddedEmail({
          org,
          event: event ?? null,
          email,
          firstName,
          type: "coach",
        }).catch(() => {});
      }
    }

    return {
      uploadId: result.uploadId,
      rowsAdded: result.added,
      rowsUpdated: result.updated,
      rowsErrored: 0,
      rowsActivated: result.activated,
      rowsPending: result.added - result.activated,
      errors: [],
    };
  }
}
