import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { users } from "#database/schema/users";
import { schoolProfiles } from "#database/schema/schools";
import { eventRosters, csvUploads } from "#database/schema/org-events";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { parseCoachCsv } from "#shared/org/csv-parser";
import { sendOrgInviteEmail } from "#shared/org/invite-email";
import { and, eq, inArray, isNull } from "drizzle-orm";

@inject()
export class UploadCoachesService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute({
    orgId,
    eventId,
    uploaderId,
    fileUrl,
    csv,
  }: {
    orgId: string;
    eventId: string;
    uploaderId: string;
    fileUrl: string;
    csv: string;
  }) {
    const { rows, errors } = parseCoachCsv(csv);

    const [org] = await this.db.use((db) =>
      db.select().from(organizations).where(eq(organizations.id, orgId))
    );

    const result = await this.db.tx(async (tx) => {
      let added = 0;
      let updated = 0;

      const [upload] = await tx.insert(csvUploads).values({
        eventId,
        type: "coach",
        fileUrl,
        uploadedBy: uploaderId,
        rowsAdded: 0,
        rowsUpdated: 0,
        rowsErrored: errors.length,
        errorDetails: errors as any,
      }).returning();

      if (rows.length > 0) {
        // Batch match users by email (join with schoolProfiles for coaches)
        const emails = rows.map((r) => r.email);
        const matchedUsers = await tx
          .select({ id: users.id, email: users.email })
          .from(users)
          .innerJoin(schoolProfiles, eq(schoolProfiles.userId, users.id))
          .where(inArray(users.email, emails));
        const byEmail = new Map(matchedUsers.map((u) => [u.email.toLowerCase(), u.id]));

        for (const r of rows) {
          const userId = byEmail.get(r.email.toLowerCase()) ?? null;

          const [existing] = await tx
            .select()
            .from(eventRosters)
            .where(and(eq(eventRosters.eventId, eventId), eq(eventRosters.email, r.email)))
            .limit(1);

          if (existing) {
            await tx.update(eventRosters).set({
              firstName: r.firstName,
              lastName: r.lastName,
              organization: r.organization,
              userId,
              isRegistered: !!userId,
              csvUploadId: upload!.id,
            }).where(eq(eventRosters.id, existing.id));
            updated += 1;
          } else {
            await tx.insert(eventRosters).values({
              eventId,
              type: "coach",
              email: r.email,
              firstName: r.firstName,
              lastName: r.lastName,
              organization: r.organization,
              userId,
              isRegistered: !!userId,
              csvUploadId: upload!.id,
            });
            added += 1;
          }

          if (userId) {
            await tx.insert(orgMemberships).values({
              userId,
              orgId,
              type: "coach",
              role: "member",
            }).onConflictDoNothing({ target: [orgMemberships.userId, orgMemberships.orgId] });
          }
        }

        await tx.update(csvUploads)
          .set({ rowsAdded: added, rowsUpdated: updated })
          .where(eq(csvUploads.id, upload!.id));
      }

      return { uploadId: upload!.id, added, updated };
    });

    // Fire-and-forget invite emails for unmatched rows (after transaction)
    if (org && rows.length > 0) {
      const uploadId = result.uploadId;
      const unmatchedRows = await this.db.use((db) =>
        db.select({ email: eventRosters.email, firstName: eventRosters.firstName })
          .from(eventRosters)
          .where(and(
            eq(eventRosters.csvUploadId, uploadId),
            isNull(eventRosters.userId),
          ))
      ).catch(() => []);

      for (const row of unmatchedRows) {
        sendOrgInviteEmail({
          org,
          email: row.email,
          firstName: row.firstName,
          type: "coach",
        }).catch(() => {});
      }
    }

    return {
      uploadId: result.uploadId,
      rowsAdded: result.added,
      rowsUpdated: result.updated,
      rowsErrored: errors.length,
      errors,
    };
  }
}
