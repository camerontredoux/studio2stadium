import { DatabaseService } from "#database/service";
import { users } from "#database/schema/users";
import {
  dancerInvites,
  orgMemberships,
  organizations,
  premiumGrants,
} from "#database/schema/organizations";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import hash from "@adonisjs/core/services/hash";
import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import type { Validator } from "./validator.ts";

export class InviteInvalidError extends Error {
  constructor(message = "Invite is invalid or has expired.") {
    super(message);
    this.name = "InviteInvalidError";
  }
}

@inject()
export class RegisterDancerService {
  constructor(private db: DatabaseService) {}

  async execute(orgSlug: string, input: Validator) {
    return this.db.tx(async (tx) => {
      const [org] = await tx
        .select()
        .from(organizations)
        .where(eq(organizations.slug, orgSlug))
        .limit(1);
      if (!org) {
        throw new InviteInvalidError();
      }

      const [invite] = await tx
        .select()
        .from(dancerInvites)
        .where(
          and(
            eq(dancerInvites.token, input.token),
            eq(dancerInvites.orgId, org.id),
            gt(dancerInvites.expiresAt, new Date()),
            isNull(dancerInvites.consumedAt)
          )
        )
        .limit(1);
      if (!invite) {
        throw new InviteInvalidError();
      }

      const usernameSeed = invite.email.split("@")[0] ?? "dancer";
      const username = `d_${usernameSeed}_${Date.now().toString(36)}`;

      const [user] = await tx
        .insert(users)
        .values({
          username,
          email: invite.email,
          displayEmail: invite.email,
          firstName: input.firstName,
          lastName: input.lastName,
          password: await hash.make(input.password),
          role: "user",
          type: "dancer",
          verified: true,
        })
        .returning();

      await tx.insert(orgMemberships).values({
        userId: user!.id,
        orgId: org.id,
        type: "dancer",
        role: "member",
      });

      const settings = (org.settings as { premium_period_days?: number }) ?? {};
      const periodDays = settings.premium_period_days ?? 90;
      const expiresAt = new Date(Date.now() + periodDays * 86400000);

      await tx.insert(premiumGrants).values({
        userId: user!.id,
        sourceType: "org_event",
        sourceId: null, // Plan 3 wires this to the active org_events.id
        expiresAt,
      });

      // Link all matching pending roster rows in this org to the new user.
      // A dancer may appear on multiple events within the same org (recurring
      // competitions) — all of them flip to active simultaneously.
      await tx
        .update(eventRosters)
        .set({ userId: user!.id })
        .where(
          and(
            eq(eventRosters.type, "dancer"),
            eq(eventRosters.email, invite.email),
            isNull(eventRosters.userId),
            inArray(
              eventRosters.eventId,
              tx
                .select({ id: orgEvents.id })
                .from(orgEvents)
                .where(eq(orgEvents.orgId, org.id))
            )
          )
        );

      await tx
        .update(dancerInvites)
        .set({ consumedAt: new Date() })
        .where(eq(dancerInvites.id, invite.id));

      return { userId: user!.id };
    });
  }
}
