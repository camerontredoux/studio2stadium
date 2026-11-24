import { featuredPlacements } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import { DatabaseService } from "#database/service";
import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { E_NOT_FOUND } from "#exceptions/not-found";
import { inject } from "@adonisjs/core";
import { and, desc, eq, sql } from "drizzle-orm";
import { Validator } from "./validator.ts";

// A spotlight features the dancer in the program's Dancer Spotlight section for
// 7 days, then expires into history.
const SPOTLIGHT_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
// A dancer may send to the same program only once per 30 days, measured from
// the moment the previous spotlight to that program was sent (not from expiry).
const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Send a Spotlight: create a 7-day Priority Spotlight placement featuring the
 * dancer to a program. Every send is a new, immutable record so expired
 * spotlights are preserved as history and sending again after the cooldown does
 * not reactivate an old record.
 *
 * Payment is not wired yet. The spotlight is created directly for development
 * and testing; the Stripe/checkout step belongs between validation and the
 * insert below — see the PAYMENT PLACEHOLDER marker.
 */
@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(dancerProfileId: string, data: Validator) {
    await this.db.tx(async (tx) => {
      // Serialize concurrent sends for this (dancer, program) pair so the
      // cooldown check and the insert are atomic. Without this, two requests
      // racing the 30-day window could both pass the check and both insert.
      // The lock is released automatically when the transaction ends.
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${`${dancerProfileId}:${data.schoolId}`}, 0))`
      );

      const [program] = await tx
        .select({ id: schoolProfiles.id })
        .from(schoolProfiles)
        .where(eq(schoolProfiles.id, data.schoolId))
        .limit(1);

      if (!program) {
        throw new E_NOT_FOUND("Program not found");
      }

      const [latest] = await tx
        .select({ sentAt: featuredPlacements.createdAt })
        .from(featuredPlacements)
        .where(
          and(
            eq(featuredPlacements.dancerId, dancerProfileId),
            eq(featuredPlacements.schoolId, data.schoolId)
          )
        )
        .orderBy(desc(featuredPlacements.createdAt))
        .limit(1);

      const now = Date.now();

      if (latest) {
        const eligibleAt = latest.sentAt.getTime() + COOLDOWN_MS;
        if (eligibleAt > now) {
          throw new E_BAD_REQUEST(
            "You can send another spotlight to this program after the 30-day cooldown ends.",
            {
              code: "E_SPOTLIGHT_COOLDOWN",
              nextEligibleAt: new Date(eligibleAt).toISOString(),
            }
          );
        }
      }

      // PAYMENT PLACEHOLDER: once Stripe checkout is wired, confirm the payment
      // here before inserting and set `paid: true`. Spotlight creation stays
      // independent of payment so it can be developed and tested without it.
      await tx.insert(featuredPlacements).values({
        dancerId: dancerProfileId,
        schoolId: data.schoolId,
        featuredUntil: new Date(now + SPOTLIGHT_DURATION_MS),
        paid: false,
      });
    });
  }
}
