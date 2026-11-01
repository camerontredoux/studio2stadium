import { BaseCommand, flags } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import { and, eq, sql } from "drizzle-orm";
import { db } from "#database/connection";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { users } from "#database/schema/users";

/**
 * Before ADR 0003 the only way to file an Organizer was as a coach with
 * `role = "admin"`. This reclassifies the ones that really are Organizers.
 *
 * Only one bucket is safe to automate. A coach membership is *evidence of a
 * person's standing in the Org*; their appearance in coach lists, roster
 * queries and scouting surfaces comes from `event_rosters`, which this command
 * never touches. So:
 *
 * - No real Roster Entry → they never coached at an event. Flipping the type
 *   to `organizer` is the whole change, and it takes them out of the
 *   coach-membership checks with no other consequence.
 * - Has a real Roster Entry → they genuinely coached. Flipping would leave the
 *   roster row (and so their place in every coach-facing list) while removing
 *   the coach membership that explains it. These are reported, never changed:
 *   whether such a person is *also* an Organizer is a human judgement, and the
 *   fix is to add an organizer membership alongside the coach one, which the
 *   partial indexes now allow.
 *
 * Staff "view-as" rosters (`is_staff = true`) are preview sandboxes already
 * excluded from every participant-facing query, so they don't count as
 * evidence of coaching.
 *
 * Idempotent: reclassified rows no longer match `type = "coach"`.
 */

export interface OrganizerCandidate {
  membershipId: string;
  orgSlug: string;
  email: string;
  name: string;
  realCoachRosters: number;
  previewRosters: number;
  /** Why this row is or isn't safe to reclassify automatically. */
  verdict: "reclassify" | "coaches-too" | "already-organizer";
}

export interface BackfillOrganizersResult {
  candidates: OrganizerCandidate[];
  reclassified: number;
}

/**
 * @param apply  false (the default) reports without writing anything.
 * @param orgSlug  limit to a single org.
 */
export async function backfillOrganizers({
  apply = false,
  orgSlug,
}: {
  apply?: boolean;
  orgSlug?: string;
} = {}): Promise<BackfillOrganizersResult> {
  const rows = await db
    .select({
      membershipId: orgMemberships.id,
      userId: orgMemberships.userId,
      orgId: orgMemberships.orgId,
      orgSlug: organizations.slug,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      realCoachRosters: sql<number>`(
        select count(*)::int from ${eventRosters} r
        join ${orgEvents} e on e.id = r.event_id
        where r.user_id = ${orgMemberships.userId}
          and e.org_id  = ${orgMemberships.orgId}
          and r.type    = 'coach'
          and r.is_staff = false
      )`,
      previewRosters: sql<number>`(
        select count(*)::int from ${eventRosters} r
        join ${orgEvents} e on e.id = r.event_id
        where r.user_id = ${orgMemberships.userId}
          and e.org_id  = ${orgMemberships.orgId}
          and r.is_staff = true
      )`,
      // Reclassifying would collide with an organizer membership they hold.
      hasOrganizer: sql<boolean>`exists (
        select 1 from ${orgMemberships} existing
        where existing.user_id = ${orgMemberships.userId}
          and existing.org_id  = ${orgMemberships.orgId}
          and existing.type    = 'organizer'
      )`,
    })
    .from(orgMemberships)
    .innerJoin(users, eq(users.id, orgMemberships.userId))
    .innerJoin(organizations, eq(organizations.id, orgMemberships.orgId))
    .where(
      and(
        eq(orgMemberships.type, "coach"),
        // The only shape an Organizer could have had before ADR 0003.
        eq(orgMemberships.role, "admin"),
        ...(orgSlug ? [eq(organizations.slug, orgSlug)] : [])
      )
    )
    .orderBy(organizations.slug, users.email);

  const candidates: OrganizerCandidate[] = rows.map((r) => ({
    membershipId: r.membershipId,
    orgSlug: r.orgSlug,
    email: r.email,
    name: `${r.firstName} ${r.lastName}`,
    realCoachRosters: r.realCoachRosters,
    previewRosters: r.previewRosters,
    verdict: r.hasOrganizer
      ? "already-organizer"
      : r.realCoachRosters > 0
        ? "coaches-too"
        : "reclassify",
  }));

  if (!apply) return { candidates, reclassified: 0 };

  let reclassified = 0;
  for (const c of candidates) {
    if (c.verdict !== "reclassify") continue;
    await db
      .update(orgMemberships)
      .set({ type: "organizer" })
      .where(eq(orgMemberships.id, c.membershipId));
    reclassified += 1;
  }

  return { candidates, reclassified };
}

export default class BackfillOrganizers extends BaseCommand {
  static commandName = "backfill:organizers";
  static description =
    "Reclassify admin coach memberships that are really Organizers (ADR 0003)";

  static options: CommandOptions = {
    startApp: true,
  };

  @flags.boolean({
    default: true,
    description: "Report without writing. Pass --no-dry-run to apply.",
  })
  declare dryRun: boolean;

  @flags.string({ description: "Limit to a single org slug" })
  declare org?: string;

  async run() {
    const { candidates, reclassified } = await backfillOrganizers({
      apply: !this.dryRun,
      orgSlug: this.org,
    });

    if (candidates.length === 0) {
      this.logger.info("No admin coach memberships found. Nothing to do.");
      return;
    }

    const toReclassify = candidates.filter((c) => c.verdict === "reclassify");
    const coachesToo = candidates.filter((c) => c.verdict === "coaches-too");
    const already = candidates.filter((c) => c.verdict === "already-organizer");

    if (toReclassify.length > 0) {
      this.logger.info(
        this.dryRun
          ? `Would reclassify ${toReclassify.length} membership(s) as organizer:`
          : `Reclassified ${reclassified} membership(s) as organizer:`
      );
      for (const c of toReclassify) {
        this.logger.log(
          `  ${c.orgSlug}  ${c.email}  (${c.name})` +
            (c.previewRosters > 0
              ? `  [${c.previewRosters} preview roster(s), ignored]`
              : "")
        );
      }
    }

    if (coachesToo.length > 0) {
      this.logger.warning(
        `${coachesToo.length} membership(s) left alone — these people hold a real ` +
          `Roster Entry, so they genuinely coached at an event:`
      );
      for (const c of coachesToo) {
        this.logger.log(
          `  ${c.orgSlug}  ${c.email}  (${c.name})  ${c.realCoachRosters} roster entr(y|ies)`
        );
      }
      this.logger.log(
        "  If any of these also run the Org, add an organizer membership " +
          "alongside their coach one rather than converting it — reclassifying " +
          "would leave them in coach-facing lists via the roster row."
      );
    }

    if (already.length > 0) {
      this.logger.info(
        `${already.length} skipped — already hold an organizer membership.`
      );
    }

    if (this.dryRun && toReclassify.length > 0) {
      this.logger.info("Dry run. Re-run with --no-dry-run to apply.");
    }
  }
}
