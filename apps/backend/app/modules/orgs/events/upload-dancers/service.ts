import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { randomBytes } from "node:crypto";
import { dancerProfiles } from "#database/schema/dancers";
import { users } from "#database/schema/users";
import {
  organizations,
  orgMemberships,
  dancerInvites,
} from "#database/schema/organizations";
import {
  orgEvents,
  eventRosters,
  csvUploads,
} from "#database/schema/org-events";
import { normalizeRowEmails, parseDancerCsv } from "#shared/org/csv-parser";
import { sendOrgInviteEmail } from "#shared/org/invite-email";
import { sendFreeTierInviteEmail } from "#shared/org/free-tier-invite-email";
import { sendOrgRosterAddedEmail } from "#shared/org/roster-added-email";
import { enforceEmailRole } from "#shared/org/role-guard";
import { verifyPreviewToken } from "#shared/org/preview-token";
import { and, eq, inArray } from "drizzle-orm";

function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

@inject()
export class UploadDancersService {
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
      const tokenResult = verifyPreviewToken(previewToken, eventId, "dancer");
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

    // Free-tier Users: when the org has the feature on, the dancer CSV must
    // carry a `paid` column, and unpaid dancers get no premium grant.
    const [org] = await this.db.use((db) =>
      db.select().from(organizations).where(eq(organizations.id, orgId))
    );
    const orgFeatures =
      (org?.features as Record<string, unknown> | undefined) ?? {};
    const freeTier = Boolean(orgFeatures.freeTierUsers);
    const orgSettings =
      (org?.settings as Record<string, unknown> | undefined) ?? {};
    const tierExpiryMonths =
      Number(orgSettings.tierExpiryMonths ?? orgFeatures.tierExpiryMonths) || 3;

    const parseResult = parseDancerCsv(csv, { requirePaid: freeTier });
    const rows = await normalizeRowEmails(parseResult.rows);
    const errors: Array<{ row: number; reason: string }> = [
      ...parseResult.errors,
    ];

    // Detect duplicate bib numbers within the uploaded file. First occurrence
    // wins; later duplicates are dropped to errors.
    const bibsInFile = new Map<number, number>(); // bib -> csvRow of first occurrence
    const rowsWithoutInFileBibDupes: typeof rows = [];
    rows.forEach((r) => {
      if (r.bibNumber !== null && r.bibNumber !== undefined) {
        const firstRow = bibsInFile.get(r.bibNumber);
        if (firstRow !== undefined) {
          errors.push({
            row: r.csvRow,
            reason: `duplicate bib number ${r.bibNumber} (first seen on row ${firstRow})`,
          });
          return;
        }
        bibsInFile.set(r.bibNumber, r.csvRow);
      }
      rowsWithoutInFileBibDupes.push(r);
    });

    // Preload existing bib -> email map for this event so we can skip rows
    // whose bib is already taken by a different dancer on this roster.
    const existingBibRows = await this.db.use((db) =>
      db
        .select({
          email: eventRosters.email,
          bibNumber: eventRosters.bibNumber,
        })
        .from(eventRosters)
        .where(eq(eventRosters.eventId, eventId))
    );
    const bibOwners = new Map<number, string>();
    for (const r of existingBibRows) {
      if (r.bibNumber !== null && r.bibNumber !== undefined)
        bibOwners.set(r.bibNumber, r.email.toLowerCase());
    }

    const filteredRows = rowsWithoutInFileBibDupes.filter((r) => {
      if (r.bibNumber === null || r.bibNumber === undefined) return true;
      const owner = bibOwners.get(r.bibNumber);
      if (owner && owner !== r.email.toLowerCase()) {
        errors.push({
          row: r.csvRow,
          reason: `bib number ${r.bibNumber} already taken by ${owner} on this event`,
        });
        return false;
      }
      return true;
    });

    // School accounts cannot be added as dancers (coach CSV is for schools).
    let rowsToProcess = filteredRows;
    if (filteredRows.length > 0) {
      const emails = filteredRows.map((r) => r.email);
      const conflicts = await this.db.use((db) =>
        enforceEmailRole(db, emails, "dancer")
      );
      const conflictSet = new Set(conflicts.map((c) => c.email.toLowerCase()));
      if (conflictSet.size > 0) {
        const next: typeof filteredRows = [];
        for (const r of filteredRows) {
          if (conflictSet.has(r.email.toLowerCase())) {
            errors.push({
              row: r.csvRow,
              reason:
                "email belongs to a school account — use the coach roster for staff",
            });
          } else {
            next.push(r);
          }
        }
        rowsToProcess = next;
      }
    }

    // Reject commit if any errors detected (defence in depth after preview gate)
    if (errors.length > 0) {
      return {
        preconditionFailed: true,
        message: `${errors.length} row${errors.length === 1 ? "" : "s"} rejected — ${errors[0]!.reason}`,
        reason: "errors_present",
        errors,
      } as const;
    }

    const [event] = await this.db.use((db) =>
      db.select().from(orgEvents).where(eq(orgEvents.id, eventId))
    );

    // Track invite tokens for fire-and-forget emails after transaction
    const inviteTokens: {
      email: string;
      firstName: string;
      token: string;
      paid?: boolean;
    }[] = [];
    // Track matched-new rows (registered dancer added to a roster for the
    // first time) for fire-and-forget notification emails after transaction.
    const matchedNotifications: { email: string; firstName: string }[] = [];

    const result = await this.db.withAudit(
      { eventId, actorId: uploaderId },
      async (tx, audit) => {
        let added = 0;
        let updated = 0;
        let activated = 0;

        if (rowsToProcess.length > 0) {
          // Match only users with a dancer profile (same idea as coach CSV + school profile).
          const emails = rowsToProcess.map((r) => r.email);
          const matchedUsers = await tx
            .select({ id: users.id, email: users.email })
            .from(users)
            .innerJoin(dancerProfiles, eq(dancerProfiles.userId, users.id))
            .where(inArray(users.email, emails));
          const byEmail = new Map(
            matchedUsers.map((u) => [u.email.toLowerCase(), u.id])
          );

          for (const r of rowsToProcess) {
            const userId = byEmail.get(r.email.toLowerCase()) ?? null;

            const rowExpiration = userId ? (() => {
              const d = new Date(event!.endDate);
              d.setMonth(d.getMonth() + tierExpiryMonths);
              return d.toISOString().split("T")[0]!;
            })() : null;

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
                  bibNumber: r.bibNumber,
                  paid: r.paid,
                  userId,
                  expirationDate: userId
                    ? rowExpiration
                    : existing.expirationDate,
                })
                .where(eq(eventRosters.id, existing.id));
              updated += 1;
            } else {
              await tx
                .insert(eventRosters)
                .values({
                  eventId,
                  type: "dancer",
                  email: r.email,
                  firstName: r.firstName,
                  lastName: r.lastName,
                  bibNumber: r.bibNumber,
                  paid: r.paid,
                  userId,
                  expirationDate: userId ? rowExpiration : null,
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
              // Create org membership for matched dancer
              await tx
                .insert(orgMemberships)
                .values({
                  userId,
                  orgId,
                  type: "dancer",
                  role: "member",
                })
                .onConflictDoNothing({
                  target: [orgMemberships.userId, orgMemberships.orgId],
                });

            } else {
              // Create dancer invite for unmatched rows
              const token = randomToken();
              inviteTokens.push({
                email: r.email,
                firstName: r.firstName,
                token,
                paid: r.paid,
              });
              const inviteExpiry = new Date(
                Date.now() + 1000 * 60 * 60 * 24 * 30
              ); // 30 days

              // Check for existing invite (orgId+email index, no unique constraint)
              const [existingInvite] = await tx
                .select()
                .from(dancerInvites)
                .where(
                  and(
                    eq(dancerInvites.orgId, orgId),
                    eq(dancerInvites.email, r.email)
                  )
                )
                .limit(1);

              if (existingInvite) {
                await tx
                  .update(dancerInvites)
                  .set({ token, expiresAt: inviteExpiry })
                  .where(eq(dancerInvites.id, existingInvite.id));
              } else {
                await tx.insert(dancerInvites).values({
                  orgId,
                  email: r.email,
                  token,
                  expiresAt: inviteExpiry,
                });
              }
            }
          }
        }

        // Insert csvUploads after the row loop so counts are authoritative
        const [upload] = await tx
          .insert(csvUploads)
          .values({
            eventId,
            type: "dancer",
            fileUrl,
            uploadedBy: uploaderId,
            rowsAdded: added,
            rowsUpdated: updated,
            rowsErrored: 0,
            errorDetails: [] as any,
          })
          .returning();

        // Backfill csvUploadId on all roster rows just inserted/updated
        if (rowsToProcess.length > 0) {
          const emails = rowsToProcess.map((r) => r.email);
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
            type: "dancer",
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

    // Fire-and-forget invite emails for unmatched rows (after transaction)
    if (org && inviteTokens.length > 0) {
      const upgradeUrl = freeTier
        ? (orgSettings.free_tier_upgrade_url as string | undefined) ?? null
        : null;

      for (const { email, firstName, token, paid } of inviteTokens) {
        if (freeTier && paid === false && upgradeUrl) {
          sendFreeTierInviteEmail({
            org,
            event: event ?? null,
            email,
            firstName,
            token,
            upgradeUrl,
            tierExpiryMonths,
          }).catch(() => {});
        } else {
          sendOrgInviteEmail({
            org,
            event: event ?? null,
            email,
            firstName,
            type: "dancer",
            token,
          }).catch(() => {});
        }
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
          type: "dancer",
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
