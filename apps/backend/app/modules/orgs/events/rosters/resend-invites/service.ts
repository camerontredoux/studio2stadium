import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { randomBytes } from "node:crypto";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { dancerInvites, organizations } from "#database/schema/organizations";
import { schoolInvites } from "#database/schema/schools";
import { sendOrgInviteEmailOrThrow } from "#shared/org/invite-email";
import { schoolInviteExpiry } from "#shared/org/school-invite-expiry";
import { sendSchoolAccountInviteEmailOrThrow } from "#shared/org/school-account-invite-email";
import {
  EMAIL_SEND_PACING_MS,
  sendThrottledEmails,
  type EmailSendTask,
} from "#shared/org/throttled-email-sender";
import { and, eq, inArray, isNull } from "drizzle-orm";
import type { Validator } from "./validator.ts";
import type { AuditContext } from "#database/audit";

function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

export interface ResendInvitesResult {
  sent: number;
  skipped: number;
  failed: Array<{ id: string; reason: string }>;
}

// Exposed for tests: allows disabling the per-item delay.
export const RESEND_PACING_MS = EMAIL_SEND_PACING_MS;

@inject()
export class ResendInvitesService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    orgSlug: string,
    eventId: string,
    input: Validator,
    auditCtx: AuditContext,
    { pacingMs = RESEND_PACING_MS }: { pacingMs?: number } = {}
  ): Promise<ResendInvitesResult> {
    // Load matching pending roster rows, scoped to event
    const rows = await this.db.use((db) =>
      db
        .select({
          id: eventRosters.id,
          email: eventRosters.email,
          firstName: eventRosters.firstName,
          organization: eventRosters.organization,
          type: eventRosters.type,
        })
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            isNull(eventRosters.userId),
            inArray(eventRosters.id, input.ids)
          )
        )
    );

    const matchedIds = new Set(rows.map((r) => r.id));
    const skipped = input.ids.filter((id) => !matchedIds.has(id)).length;

    // Load org + event once for email content
    const [org, event] = await Promise.all([
      this.db.use((db) =>
        db
          .select()
          .from(organizations)
          .where(eq(organizations.slug, orgSlug))
          .then((r) => r[0] ?? null)
      ),
      this.db.use((db) =>
        db
          .select()
          .from(orgEvents)
          .where(eq(orgEvents.id, eventId))
          .then((r) => r[0] ?? null)
      ),
    ]);

    if (!org) {
      return { sent: 0, skipped: input.ids.length, failed: [] };
    }

    const failed: Array<{ id: string; reason: string }> = [];
    const rowIdsByTask = new Map<EmailSendTask, string>();
    const tasks = rows.map((row) => {
      let invitePrepared = false;
      let task: EmailSendTask;

      if (row.type === "dancer") {
        // Resolved inside the tx on first prepare, then reused across email
        // retries so a transient send failure never re-runs the tx or changes
        // the token that was emailed.
        let token: string;
        task = {
          recipient: row.email,
          send: async () => {
            if (!invitePrepared) {
              await this.db.tx(async (tx) => {
                const [existing] = await tx
                  .select()
                  .from(dancerInvites)
                  .where(
                    and(
                      eq(dancerInvites.orgId, org.id),
                      eq(dancerInvites.email, row.email)
                    )
                  )
                  .limit(1);

                const nowPlus14d = new Date(
                  Date.now() + 1000 * 60 * 60 * 24 * 14
                );

                if (existing) {
                  // Reuse the existing token so previously emailed links stay
                  // valid; extend expiry without ever shortening it and never
                  // reset consumedAt (an already-registered invite stays consumed).
                  token = existing.token;
                  const newExpiresAt =
                    existing.expiresAt > nowPlus14d
                      ? existing.expiresAt
                      : nowPlus14d;
                  await tx
                    .update(dancerInvites)
                    .set({ expiresAt: newExpiresAt })
                    .where(eq(dancerInvites.id, existing.id));
                } else {
                  token = randomToken();
                  await tx.insert(dancerInvites).values({
                    orgId: org.id,
                    email: row.email,
                    token,
                    expiresAt: nowPlus14d,
                  });
                }
              });
              invitePrepared = true;
            }

            await sendOrgInviteEmailOrThrow({
              org,
              event,
              email: row.email,
              firstName: row.firstName,
              type: "dancer",
              token,
            });
          },
        };
      } else {
        // Resolved inside the tx on first prepare, then reused across email
        // retries so a transient send failure never re-runs the tx or changes
        // the token that was emailed.
        let token: string;
        task = {
          recipient: row.email,
          send: async () => {
            if (!invitePrepared) {
              await this.db.tx(async (tx) => {
                const [existing] = await tx
                  .select()
                  .from(schoolInvites)
                  .where(
                    and(
                      eq(schoolInvites.eventId, eventId),
                      eq(schoolInvites.email, row.email)
                    )
                  )
                  .limit(1);

                // Coach invites must outlive far-future events, matching
                // upload-coaches.
                const expiresAt = schoolInviteExpiry(event?.startDate);

                if (existing) {
                  // Reuse the existing token so previously emailed links stay
                  // valid; extend expiry without ever shortening it and never
                  // reset consumedAt (an already-claimed invite stays consumed).
                  token = existing.token;
                  const newExpiresAt =
                    existing.expiresAt > expiresAt
                      ? existing.expiresAt
                      : expiresAt;
                  await tx
                    .update(schoolInvites)
                    .set({ expiresAt: newExpiresAt })
                    .where(eq(schoolInvites.id, existing.id));
                } else {
                  token = randomBytes(32).toString("hex");
                  await tx.insert(schoolInvites).values({
                    eventId,
                    email: row.email,
                    organization: row.organization,
                    token,
                    expiresAt,
                  });
                }
              });
              invitePrepared = true;
            }

            await sendSchoolAccountInviteEmailOrThrow({
              org,
              event,
              email: row.email,
              firstName: row.firstName,
              token,
            });
          },
        };
      }

      rowIdsByTask.set(task, row.id);
      return task;
    });

    const { sent } = await sendThrottledEmails(tasks, {
      pacingMs,
      onTerminalFailure: (task, error) => {
        failed.push({
          id: rowIdsByTask.get(task)!,
          reason: error instanceof Error ? error.message : String(error),
        });
      },
    });

    // Log a single audit entry summarizing the resend operation
    await this.db.withAudit(auditCtx, async (_tx, auditLog) => {
      auditLog.log({
        action: "resend_invite",
        resource: "invite",
        metadata: {
          ids: input.ids,
          rosterTypes: rows.map((row) => ({ id: row.id, type: row.type })),
          sent,
          skipped,
          failed,
        },
      });
    });

    return { sent, skipped, failed };
  }
}
