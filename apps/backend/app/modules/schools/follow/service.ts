import { follows } from "#database/schema/profiles";
import { DatabaseService } from "#database/service";
import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { GetSubscriptionService } from "#modules/subscriptions/get-status/service";
import { PASS_PROGRAM_LIMIT } from "#shared/plans";
import { inject } from "@adonisjs/core";
import { and, count, eq, ne, sql } from "drizzle-orm";
import { FollowSchoolEvent } from "./event.ts";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(
    private db: DatabaseService,
    private subscriptions: GetSubscriptionService
  ) {}

  async execute({ params }: Validator, profileId: string, userId: string) {
    const { access } = await this.subscriptions.execute(userId);

    const created = await this.db.tx(async (tx) => {
      if (access === "pass") {
        // Hold the dancer's lock from the count to the insert, so follows
        // sent at the same time cannot all pass the limit.
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${profileId}))`
        );

        const [others] = await tx
          .select({ count: count() })
          .from(follows)
          .where(
            and(
              eq(follows.dancerId, profileId),
              ne(follows.schoolId, params.id)
            )
          );

        if (others.count >= PASS_PROGRAM_LIMIT) {
          throw new E_BAD_REQUEST(
            `A 1-Week Pass lets you follow up to ${PASS_PROGRAM_LIMIT} programs. Unfollow one, or upgrade to Premium to follow more.`
          );
        }
      }

      const rows = await tx
        .insert(follows)
        .values({ dancerId: profileId, schoolId: params.id })
        .onConflictDoNothing()
        .returning({ id: follows.id });

      return rows.length > 0;
    });

    if (!created) {
      return { created: false };
    }

    FollowSchoolEvent.dispatch({
      dancerId: profileId,
      schoolId: params.id,
    });

    return { created: true };
  }
}
