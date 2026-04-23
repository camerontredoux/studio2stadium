import { DatabaseService } from "#database/service";
import { eventRosters } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import type { SessionUser } from "#auth/provider";
import { and, eq, isNull } from "drizzle-orm";

type AttendType = "coach" | "dancer";

@inject()
export class AttendEventService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, user: SessionUser, type: AttendType) {
    return this.db.tx(async (tx) => {
      const [existingByUser] = await tx
        .select()
        .from(eventRosters)
        .where(
          and(eq(eventRosters.eventId, eventId), eq(eventRosters.userId, user.id))
        )
        .limit(1);

      if (existingByUser) {
        const shouldUpdate =
          existingByUser.type !== type ||
          existingByUser.email !== user.displayEmail ||
          existingByUser.firstName !== user.firstName ||
          existingByUser.lastName !== user.lastName;

        if (shouldUpdate) {
          const [updated] = await tx
            .update(eventRosters)
            .set({
              type,
              email: user.displayEmail,
              firstName: user.firstName,
              lastName: user.lastName,
            })
            .where(eq(eventRosters.id, existingByUser.id))
            .returning();
          return updated!;
        }

        return existingByUser;
      }

      const [existingByEmail] = await tx
        .select()
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.email, user.displayEmail),
            isNull(eventRosters.userId)
          )
        )
        .limit(1);

      if (existingByEmail) {
        const [claimed] = await tx
          .update(eventRosters)
          .set({
            userId: user.id,
            type,
            firstName: user.firstName,
            lastName: user.lastName,
          })
          .where(eq(eventRosters.id, existingByEmail.id))
          .returning();
        return claimed!;
      }

      const [created] = await tx
        .insert(eventRosters)
        .values({
          eventId,
          userId: user.id,
          type,
          email: user.displayEmail,
          firstName: user.firstName,
          lastName: user.lastName,
        })
        .returning();

      return created!;
    });
  }
}
