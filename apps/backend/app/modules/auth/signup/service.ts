import { schoolProfiles, schoolInvites } from "#database/schema/schools";
import { platforms, users } from "#database/schema/users";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { orgMemberships } from "#database/schema/organizations";
import { DatabaseService, type Transaction } from "#database/service";
import { normalizeEmail } from "#utils/normalize-email";
import { inject } from "@adonisjs/core";
import hash from "@adonisjs/core/services/hash";
import { and, eq, isNull } from "drizzle-orm";
import { SignupEvent } from "./event.ts";
import type { Validator } from "./validator.ts";
import { nonOrganizerMembershipConflict } from "#shared/org/membership";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(input: Validator) {
    const user = await this.createUser(input);

    SignupEvent.dispatch(user);

    return user;
  }

  async createUser(input: Validator) {
    const [email, password] = await Promise.all([
      normalizeEmail(input.email),
      hash.make(input.password),
    ]);

    return await this.db.tx(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: email,
          displayEmail: input.email,
          password: password,
          firstName: input.firstName,
          lastName: input.lastName,
          type: input.type,
          username: input.username,
          phone: input.phone,
          role: "user",
        })
        .returning({
          id: users.id,
          displayEmail: users.displayEmail,
          firstName: users.firstName,
          lastName: users.lastName,
          type: users.type,
        });

      await tx.insert(platforms).values({
        platformName: "core",
        userId: user.id,
      });

      if (input.type === "school") {
        if (!input.name || !input.location) {
          throw new Error("Cannot create school without name or location");
        }

        await tx.insert(schoolProfiles).values({
          userId: user.id,
          name: input.name,
          location: input.location,
          city: input.city,
        });

        // Path C: opportunistically link pending coach roster rows for this email.
        // Only safe once verified=true — defer otherwise to prevent impersonation.
        // (Direct signup sets verified=false; verification route will re-run this.)
        const isVerified = (input as { verified?: boolean }).verified === true;
        if (isVerified) {
          await this.linkPendingRosters(tx, user.id, email);
        }
      }

      return user;
    });
  }

  // Links all pending coach roster rows whose email matches, and marks any
  // unconsumed schoolInvites consumed. Runs inside the caller's transaction.
  async linkPendingRosters(tx: Transaction, userId: string, email: string) {
    const pendingRosters = await tx
      .select({ id: eventRosters.id, eventId: eventRosters.eventId })
      .from(eventRosters)
      .where(
        and(
          eq(eventRosters.type, "coach"),
          eq(eventRosters.email, email),
          isNull(eventRosters.userId)
        )
      );

    if (pendingRosters.length === 0) return;

    for (const roster of pendingRosters) {
      await tx
        .update(eventRosters)
        .set({ userId })
        .where(eq(eventRosters.id, roster.id));

      const [event] = await tx
        .select({ orgId: orgEvents.orgId })
        .from(orgEvents)
        .where(eq(orgEvents.id, roster.eventId))
        .limit(1);

      if (event) {
        await tx
          .insert(orgMemberships)
          .values({ userId, orgId: event.orgId, type: "coach", role: "member" })
          .onConflictDoNothing(nonOrganizerMembershipConflict());
      }
    }

    // Mark all unconsumed schoolInvites for this email consumed
    await tx
      .update(schoolInvites)
      .set({ consumedAt: new Date() })
      .where(
        and(eq(schoolInvites.email, email), isNull(schoolInvites.consumedAt))
      );
  }
}
