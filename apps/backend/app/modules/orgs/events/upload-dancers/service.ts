import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { randomBytes } from "node:crypto";
import { users } from "#database/schema/users";
import { organizations, orgMemberships, premiumGrants, dancerInvites } from "#database/schema/organizations";
import { orgEvents, eventRosters, csvUploads } from "#database/schema/org-events";
import { parseDancerCsv } from "#shared/org/csv-parser";
import { sendOrgInviteEmail } from "#shared/org/invite-email";
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
  }: {
    orgId: string;
    eventId: string;
    uploaderId: string;
    fileUrl: string;
    csv: string;
  }) {
    const { rows, errors } = parseDancerCsv(csv);

    const [org] = await this.db.use((db) =>
      db.select().from(organizations).where(eq(organizations.id, orgId))
    );

    const [event] = await this.db.use((db) =>
      db.select().from(orgEvents).where(eq(orgEvents.id, eventId))
    );

    // Calculate grant expiry based on org settings and event end date
    const settings = (org?.settings as { premium_period_days?: number }) ?? {};
    const periodDays = settings.premium_period_days ?? 90;
    const eventEndDate = new Date((event!.endDate as string) + "T00:00:00Z");
    const grantExpires = new Date(eventEndDate);
    grantExpires.setDate(grantExpires.getDate() + periodDays);
    const expirationDate = grantExpires.toISOString().slice(0, 10); // "YYYY-MM-DD"

    // Track invite tokens for fire-and-forget emails after transaction
    const inviteTokens: { email: string; firstName: string; token: string }[] = [];

    const result = await this.db.tx(async (tx) => {
      let added = 0;
      let updated = 0;

      const [upload] = await tx.insert(csvUploads).values({
        eventId,
        type: "dancer",
        fileUrl,
        uploadedBy: uploaderId,
        rowsAdded: 0,
        rowsUpdated: 0,
        rowsErrored: errors.length,
        errorDetails: errors as any,
      }).returning();

      if (rows.length > 0) {
        // Batch match users by email only (dancers may not have school profiles)
        const emails = rows.map((r) => r.email);
        const matchedUsers = await tx
          .select({ id: users.id, email: users.email })
          .from(users)
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
              bibNumber: r.bibNumber,
              userId,
              isRegistered: !!userId,
              expirationDate: userId ? expirationDate : existing.expirationDate,
              csvUploadId: upload!.id,
            }).where(eq(eventRosters.id, existing.id));
            updated += 1;
          } else {
            await tx.insert(eventRosters).values({
              eventId,
              type: "dancer",
              email: r.email,
              firstName: r.firstName,
              lastName: r.lastName,
              bibNumber: r.bibNumber,
              userId,
              isRegistered: !!userId,
              expirationDate: userId ? expirationDate : null,
              csvUploadId: upload!.id,
            });
            added += 1;
          }

          if (userId) {
            // Create org membership for matched dancer
            await tx.insert(orgMemberships).values({
              userId,
              orgId,
              type: "dancer",
              role: "member",
            }).onConflictDoNothing({ target: [orgMemberships.userId, orgMemberships.orgId] });

            // Create premium grant
            await tx.insert(premiumGrants).values({
              userId,
              sourceType: "org_event",
              sourceId: eventId,
              expiresAt: grantExpires,
            }).onConflictDoNothing();
          } else {
            // Create dancer invite for unmatched rows
            const token = randomToken();
            inviteTokens.push({ email: r.email, firstName: r.firstName, token });
            const inviteExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

            // Check for existing invite (orgId+email index, no unique constraint)
            const [existingInvite] = await tx
              .select()
              .from(dancerInvites)
              .where(and(eq(dancerInvites.orgId, orgId), eq(dancerInvites.email, r.email)))
              .limit(1);

            if (existingInvite) {
              await tx.update(dancerInvites)
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

        await tx.update(csvUploads)
          .set({ rowsAdded: added, rowsUpdated: updated })
          .where(eq(csvUploads.id, upload!.id));
      }

      return { uploadId: upload!.id, added, updated };
    });

    // Fire-and-forget invite emails for unmatched rows (after transaction)
    if (org && inviteTokens.length > 0) {
      for (const { email, firstName, token } of inviteTokens) {
        sendOrgInviteEmail({
          org,
          email,
          firstName,
          type: "dancer",
          token,
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
