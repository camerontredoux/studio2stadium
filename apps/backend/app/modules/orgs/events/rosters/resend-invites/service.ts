import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { randomBytes } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import {
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import {
  dancerInvites,
  organizations,
} from "#database/schema/organizations";
import { sendOrgInviteEmailOrThrow } from "#shared/org/invite-email";
import { and, eq, inArray, isNull } from "drizzle-orm";
import type { Validator } from "./validator.ts";

function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

export interface ResendInvitesResult {
  sent: number;
  skipped: number;
  failed: Array<{ id: string; reason: string }>;
}

// Exposed for tests: allows disabling the per-item delay.
export const RESEND_PACING_MS = 100;

@inject()
export class ResendInvitesService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    orgSlug: string,
    eventId: string,
    input: Validator,
    { pacingMs = RESEND_PACING_MS }: { pacingMs?: number } = {},
  ): Promise<ResendInvitesResult> {
    // Load matching rows: pending dancers only, scoped to event
    const rows = await this.db.use((db) =>
      db
        .select({
          id: eventRosters.id,
          email: eventRosters.email,
          firstName: eventRosters.firstName,
        })
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.type, "dancer"),
            isNull(eventRosters.userId),
            inArray(eventRosters.id, input.ids),
          ),
        ),
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
          .then((r) => r[0] ?? null),
      ),
      this.db.use((db) =>
        db
          .select()
          .from(orgEvents)
          .where(eq(orgEvents.id, eventId))
          .then((r) => r[0] ?? null),
      ),
    ]);

    if (!org) {
      return { sent: 0, skipped: input.ids.length, failed: [] };
    }

    let sent = 0;
    const failed: Array<{ id: string; reason: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      try {
        const token = randomToken();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
        await this.db.tx(async (tx) => {
          await tx
            .delete(dancerInvites)
            .where(
              and(
                eq(dancerInvites.orgId, org.id),
                eq(dancerInvites.email, row.email),
              ),
            );
          await tx.insert(dancerInvites).values({
            orgId: org.id,
            email: row.email,
            token,
            expiresAt,
          });
        });

        await sendOrgInviteEmailOrThrow({
          org,
          event,
          email: row.email,
          firstName: row.firstName,
          type: "dancer",
          token,
        });

        sent += 1;
      } catch (err) {
        failed.push({
          id: row.id,
          reason: err instanceof Error ? err.message : String(err),
        });
      }

      if (pacingMs > 0 && i < rows.length - 1) {
        await sleep(pacingMs);
      }
    }

    return { sent, skipped, failed };
  }
}
