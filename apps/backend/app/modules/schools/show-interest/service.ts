import { interests } from "#database/schema/index";
import { DatabaseService } from "#database/service";
import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { E_DATABASE_ERROR } from "#exceptions/database";
import { GetSubscriptionService } from "#modules/subscriptions/get-status/service";
import { PASS_PROGRAM_LIMIT } from "#shared/plans";
import { inject } from "@adonisjs/core";
import { and, count, eq, ne, sql } from "drizzle-orm";
import { ShowInterestEvent } from "./event.ts";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(
    private db: DatabaseService,
    private subscriptions: GetSubscriptionService
  ) {}

  async execute({ params }: Validator, profileId: string, userId: string) {
    let interestCount = 1;
    const { access } = await this.subscriptions.execute(userId);

    try {
      const [result] = await this.db.tx(async (tx) => {
        if (access === "pass") {
          // A Week Pass pushes the profile to at most five programs. The
          // dancer's lock holds from the count to the insert.
          await tx.execute(
            sql`select pg_advisory_xact_lock(hashtext(${profileId}))`
          );

          const [others] = await tx
            .select({ count: count() })
            .from(interests)
            .where(
              and(
                eq(interests.dancerId, profileId),
                ne(interests.schoolId, params.id)
              )
            );

          if (others.count >= PASS_PROGRAM_LIMIT) {
            throw new E_BAD_REQUEST(
              `A 1-Week Pass lets you show interest in up to ${PASS_PROGRAM_LIMIT} programs. Upgrade to Premium to reach more.`
            );
          }
        }

        return await tx
          .insert(interests)
          .values({
            dancerId: profileId,
            schoolId: params.id,
          })
          .onConflictDoUpdate({
            target: [interests.dancerId, interests.schoolId],
            set: {
              count: sql`${interests.count} + 1`,
            },
          })
          .returning({ count: interests.count });
      });
      interestCount = result.count;
    } catch (error) {
      if (error instanceof E_DATABASE_ERROR) {
        if (error.code === "E_CHECK_CONSTRAINT_VIOLATION") {
          return { created: false };
        }
      }
      throw error;
    }

    ShowInterestEvent.dispatch({
      dancerId: profileId,
      schoolId: params.id,
      interestCount,
    });

    return { created: true };
  }
}
