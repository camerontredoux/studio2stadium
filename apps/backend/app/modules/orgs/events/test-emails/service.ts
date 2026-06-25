import { DatabaseService } from "#database/service";
import { E_NOT_FOUND } from "#exceptions/not-found";
import { inject } from "@adonisjs/core";
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { orgEvents } from "#database/schema/org-events";
import type { organizations } from "#database/schema/organizations";
import { sendOrgInviteEmailOrThrow } from "#shared/org/invite-email";
import { sendOrgRosterAddedEmailOrThrow } from "#shared/org/roster-added-email";
import { sendSchoolAccountInviteEmailOrThrow } from "#shared/org/school-account-invite-email";
import { sendFreeTierInviteEmailOrThrow } from "#shared/org/free-tier-invite-email";
import type { Validator } from "./validator.ts";

@inject()
export class TestEmailsService {
  constructor(private db: DatabaseService) {}

  async execute(
    org: typeof organizations.$inferSelect,
    input: Validator,
    recipient: { email: string; firstName: string }
  ): Promise<{ kind: Validator["kind"]; email: string }> {
    // Optionally load the event to fill in event-specific details. Scoped to
    // the org so admins can only preview their own events.
    let event: typeof orgEvents.$inferSelect | null = null;
    if (input.eventId) {
      event = await this.db.use((db) =>
        db
          .select()
          .from(orgEvents)
          .where(
            and(eq(orgEvents.id, input.eventId!), eq(orgEvents.orgId, org.id))
          )
          .then((r) => r[0] ?? null)
      );
      if (!event) {
        throw new E_NOT_FOUND("Event not found.");
      }
    }

    const audience = input.audience ?? "dancer";
    // A throwaway token so the email's CTA link renders. It is not persisted —
    // these are visual test sends, the link itself won't resolve.
    const token = randomBytes(32).toString("base64url");

    switch (input.kind) {
      case "invite":
        await sendOrgInviteEmailOrThrow({
          org,
          event,
          email: recipient.email,
          firstName: recipient.firstName,
          type: audience,
          token,
        });
        break;
      case "roster-added":
        await sendOrgRosterAddedEmailOrThrow({
          org,
          event,
          email: recipient.email,
          firstName: recipient.firstName,
          type: audience,
        });
        break;
      case "school-account-invite":
        await sendSchoolAccountInviteEmailOrThrow({
          org,
          event,
          email: recipient.email,
          firstName: recipient.firstName,
          token,
        });
        break;
      case "free-tier-invite": {
        const orgSettings =
          (org.settings as Record<string, unknown> | undefined) ?? {};
        const tierExpiryMonths =
          Number(orgSettings.tierExpiryMonths) || 3;
        const upgradeUrl =
          (orgSettings.free_tier_upgrade_url as string | undefined) ??
          "https://example.com/upgrade";
        await sendFreeTierInviteEmailOrThrow({
          org,
          event,
          email: recipient.email,
          firstName: recipient.firstName,
          token,
          upgradeUrl,
          tierExpiryMonths,
        });
        break;
      }
    }

    return { kind: input.kind, email: recipient.email };
  }
}
