import { DatabaseService } from "#database/service";
import { users, platforms } from "#database/schema/users";
import { schoolProfiles, schoolInvites } from "#database/schema/schools";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { orgMemberships } from "#database/schema/organizations";
import { inject } from "@adonisjs/core";
import hash from "@adonisjs/core/services/hash";
import { and, eq, isNull } from "drizzle-orm";
import type { Validator } from "./validator.ts";

export class InviteInvalidError extends Error {
  constructor(message = "Invite is invalid or has expired.") {
    super(message);
    this.name = "InviteInvalidError";
  }
}

@inject()
export class RegisterSchoolService {
  constructor(private db: DatabaseService) {}

  async execute(input: Validator) {
    return this.db.tx(async (tx) => {
      const [invite] = await tx
        .select()
        .from(schoolInvites)
        .where(eq(schoolInvites.token, input.token))
        .limit(1);

      if (!invite) {
        throw new InviteInvalidError(
          "This invite link is not valid. Check for a newer invitation email, or sign in if you already have an account."
        );
      }
      if (invite.consumedAt) {
        throw new InviteInvalidError(
          "You've already created your account. Please sign in."
        );
      }
      if (invite.expiresAt <= new Date()) {
        throw new InviteInvalidError(
          "This invite has expired. Ask your organization to resend your invitation."
        );
      }

      const usernameSeed = invite.email.split("@")[0] ?? "school";
      const username = `s_${usernameSeed}_${Date.now().toString(36)}`;

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
          type: "school",
          // Token consumption counts as email verification — inbox proven by clicking
          verified: true,
        })
        .returning();

      await tx.insert(platforms).values({
        platformName: "core",
        userId: user!.id,
      });

      await tx.insert(schoolProfiles).values({
        userId: user!.id,
        name: input.name,
        location: input.location,
        city: input.city,
      });

      // Link all pending coach roster rows for this event to the new user
      await tx
        .update(eventRosters)
        .set({ userId: user!.id })
        .where(
          and(
            eq(eventRosters.eventId, invite.eventId),
            eq(eventRosters.type, "coach"),
            eq(eventRosters.email, invite.email),
            isNull(eventRosters.userId)
          )
        );

      // Look up the org for this event to create the membership
      const [event] = await tx
        .select({ orgId: orgEvents.orgId })
        .from(orgEvents)
        .where(eq(orgEvents.id, invite.eventId))
        .limit(1);

      if (event) {
        await tx
          .insert(orgMemberships)
          .values({
            userId: user!.id,
            orgId: event.orgId,
            type: "coach",
            role: "member",
          })
          .onConflictDoNothing({
            target: [orgMemberships.userId, orgMemberships.orgId],
          });
      }

      await tx
        .update(schoolInvites)
        .set({ consumedAt: new Date() })
        .where(eq(schoolInvites.id, invite.id));

      return { userId: user!.id };
    });
  }
}
