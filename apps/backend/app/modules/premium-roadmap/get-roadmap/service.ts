import { follows, programViews } from "#database/schema/profiles";
import { videos, videoUploads } from "#database/schema/media";
import {
  premiumRoadmaps,
  subscriptions,
  weekPasses,
} from "#database/schema/subscriptions";
import { trackerItems } from "#database/schema/tracker";
import { DatabaseService } from "#database/service";
import { Service as ProfileChecklistService } from "#modules/dancers/profile/get-profile-checklist/service";
import {
  subscriptionGivesAccess,
  subscriptionPlanFor,
  type PaidPlan,
} from "#shared/plans";
import { inject } from "@adonisjs/core";
import { and, desc, eq, isNotNull, lte, sql } from "drizzle-orm";

export const ROADMAP_VERSION = 1;
export const ROADMAP_DAYS = 30;
export const PROGRAM_VIEW_TARGET = 5;

const DAY_MS = 86_400_000;
// An upload still pending after this long was abandoned, not processing.
const PROCESSING_WINDOW_MS = DAY_MS;

export type StepKey =
  | "profile"
  | "video"
  | "program_views"
  | "tracker"
  | "favorite";

export type StepStatus = "complete" | "incomplete" | "processing" | "not_ready";

export interface RoadmapStep {
  key: StepKey;
  status: StepStatus;
  // First time the step was complete. Kept even if the step later becomes
  // incomplete again (e.g. the video was deleted).
  completedAt: Date | null;
  count?: number;
  target?: number;
}

export interface RoadmapDetails {
  version: number;
  premiumStartedAt: Date;
  daysSinceStart: number;
  interval: PaidPlan | null;
  completedCount: number;
  totalCount: number;
  // First time all five steps were complete.
  completedAt: Date | null;
  firstViewedAt: Date;
  steps: RoadmapStep[];
  // Steps whose completion was first recorded by this request, so the client
  // can send each completion analytics event once.
  newlyCompleted: StepKey[];
  // True when this request recorded the roadmap's completion.
  roadmapNewlyCompleted: boolean;
}

// `roadmap` is null exactly when `eligible` is false.
export interface Roadmap {
  eligible: boolean;
  roadmap: RoadmapDetails | null;
}

const INELIGIBLE: Roadmap = { eligible: false, roadmap: null };

/**
 * Paying Stripe Premium right now. Org-granted Premium (premium_grants) is
 * deliberately excluded: the roadmap is for members who pay. A running Week
 * Pass also qualifies; see `GetRoadmapService.weekPassStart`.
 */
export function paidPremium(now: Date) {
  return and(
    eq(subscriptions.source, "stripe"),
    subscriptionGivesAccess(now),
    isNotNull(subscriptions.startedAt)
  );
}

// Keep the stored timestamp if there is one; otherwise take the new value.
const keepFirst = (column: string) =>
  sql.raw(`coalesce(premium_roadmaps.${column}, excluded.${column})`);

@inject()
export class GetRoadmapService {
  constructor(
    private db: DatabaseService,
    private profileChecklist: ProfileChecklistService
  ) {}

  /**
   * When the member started paying and on which plan: a paying Stripe
   * subscription first, else a running Week Pass. Null when neither.
   */
  private async membership(userId: string, now: Date) {
    const [roadmap] = await this.db.use((db) =>
      db
        .select({ startedAt: premiumRoadmaps.premiumStartedAt })
        .from(premiumRoadmaps)
        .where(eq(premiumRoadmaps.userId, userId))
    );
    const roadmapStartedAt = roadmap?.startedAt ?? null;

    const [subscription] = await this.db.use((db) =>
      db
        .select({
          startedAt: subscriptions.startedAt,
          priceId: subscriptions.priceId,
        })
        .from(subscriptions)
        .where(and(eq(subscriptions.userId, userId), paidPremium(now)))
        .limit(1)
    );

    if (subscription?.startedAt) {
      return {
        startedAt: subscription.startedAt,
        interval: subscriptionPlanFor(subscription.priceId) as PaidPlan | null,
        roadmapStartedAt,
      };
    }

    const passStartedAt = await this.weekPassStart(userId, now);
    if (!passStartedAt) return null;

    return {
      startedAt: passStartedAt,
      interval: "week_pass" as PaidPlan | null,
      roadmapStartedAt,
    };
  }

  /**
   * When the Dancer's current run of Week Passes began, or null when no pass
   * is running. A pass bought while another runs starts when that one ends,
   * so back-to-back passes count as one run.
   */
  private async weekPassStart(userId: string, now: Date) {
    const passes = await this.db.use((db) =>
      db
        .select({ startsAt: weekPasses.startsAt, endsAt: weekPasses.endsAt })
        .from(weekPasses)
        .where(
          and(eq(weekPasses.userId, userId), lte(weekPasses.startsAt, now))
        )
        .orderBy(desc(weekPasses.endsAt))
    );

    const [latest] = passes;
    if (!latest || latest.endsAt <= now) return null;

    let startedAt = latest.startsAt;
    for (const pass of passes.slice(1)) {
      if (pass.endsAt.getTime() < startedAt.getTime()) break;
      if (pass.startsAt < startedAt) startedAt = pass.startsAt;
    }
    return startedAt;
  }

  async execute(user: { id: string; profileId: string }): Promise<Roadmap> {
    const now = new Date();

    const membership = await this.membership(user.id, now);

    if (!membership?.startedAt) return INELIGIBLE;

    // Every paying member gets a roadmap, however long they have paid. The
    // client hides the card once all steps are done and day 30 has passed.
    const premiumStartedAt =
      membership.roadmapStartedAt ?? membership.startedAt;

    // Steps count activity since the member started paying. The roadmap's
    // own start can be later (a one-off restart in October 2026 moved it
    // for existing members), and that must not undo earlier progress.
    const factsSince = new Date(
      Math.min(premiumStartedAt.getTime(), membership.startedAt.getTime())
    );

    const [checklist, facts] = await Promise.all([
      this.profileChecklist.execute(user.profileId),
      this.stepFacts(user, factsSince, now),
    ]);

    const done = {
      profile:
        !!checklist &&
        checklist.gpa &&
        checklist.location &&
        checklist.skills &&
        checklist.styles &&
        checklist.sports,
      video: facts.hasVideo,
      program_views: facts.programViews >= PROGRAM_VIEW_TARGET,
      tracker: facts.hasTrackerItem,
      favorite: facts.hasFollow,
    } satisfies Record<StepKey, boolean>;
    const allDone = Object.values(done).every(Boolean);
    const stamp = (complete: boolean) => (complete ? now : null);

    const [roadmap] = await this.db.use((db) =>
      db
        .insert(premiumRoadmaps)
        .values({
          userId: user.id,
          roadmapVersion: ROADMAP_VERSION,
          premiumStartedAt,
          firstViewedAt: now,
          profileCompletedAt: stamp(done.profile),
          videoCompletedAt: stamp(done.video),
          programViewsCompletedAt: stamp(done.program_views),
          trackerCompletedAt: stamp(done.tracker),
          favoriteCompletedAt: stamp(done.favorite),
          roadmapCompletedAt: stamp(allDone),
        })
        .onConflictDoUpdate({
          target: premiumRoadmaps.userId,
          set: {
            firstViewedAt: keepFirst("first_viewed_at"),
            profileCompletedAt: keepFirst("profile_completed_at"),
            videoCompletedAt: keepFirst("video_completed_at"),
            programViewsCompletedAt: keepFirst("program_views_completed_at"),
            trackerCompletedAt: keepFirst("tracker_completed_at"),
            favoriteCompletedAt: keepFirst("favorite_completed_at"),
            roadmapCompletedAt: keepFirst("roadmap_completed_at"),
          },
        })
        .returning()
    );

    const profileAndVideoReady = done.profile && done.video;
    const steps: RoadmapStep[] = [
      {
        key: "profile",
        status: done.profile ? "complete" : "incomplete",
        completedAt: roadmap.profileCompletedAt,
      },
      {
        key: "video",
        status: done.video
          ? "complete"
          : facts.videoProcessing
            ? "processing"
            : "incomplete",
        completedAt: roadmap.videoCompletedAt,
      },
      {
        key: "program_views",
        status: done.program_views ? "complete" : "incomplete",
        completedAt: roadmap.programViewsCompletedAt,
        count: Math.min(facts.programViews, PROGRAM_VIEW_TARGET),
        target: PROGRAM_VIEW_TARGET,
      },
      {
        key: "tracker",
        status: done.tracker ? "complete" : "incomplete",
        completedAt: roadmap.trackerCompletedAt,
      },
      {
        key: "favorite",
        status: done.favorite
          ? "complete"
          : profileAndVideoReady
            ? "incomplete"
            : "not_ready",
        completedAt: roadmap.favoriteCompletedAt,
      },
    ];

    // A timestamp equal to `now` was written by this request; one kept from
    // an earlier request is older.
    const recordedNow = (at: Date | null) => at?.getTime() === now.getTime();

    return {
      eligible: true,
      roadmap: {
        version: roadmap.roadmapVersion,
        premiumStartedAt: roadmap.premiumStartedAt,
        daysSinceStart: Math.floor(
          (now.getTime() - roadmap.premiumStartedAt.getTime()) / DAY_MS
        ),
        interval: membership.interval,
        completedCount: steps.filter((step) => step.status === "complete")
          .length,
        totalCount: steps.length,
        completedAt: roadmap.roadmapCompletedAt,
        firstViewedAt: roadmap.firstViewedAt!,
        steps,
        newlyCompleted: steps
          .filter((step) => recordedNow(step.completedAt))
          .map((step) => step.key),
        roadmapNewlyCompleted: recordedNow(roadmap.roadmapCompletedAt),
      },
    };
  }

  // Everything except the profile checklist, in one round trip.
  private async stepFacts(
    user: { id: string; profileId: string },
    factsSince: Date,
    now: Date
  ) {
    // Raw sql params go to postgres-js untyped, so pass dates as ISO text.
    const processingSince = new Date(
      now.getTime() - PROCESSING_WINDOW_MS
    ).toISOString();
    const since = factsSince.toISOString();

    const [row] = await this.db.use((db) =>
      db.execute<{
        hasVideo: boolean;
        videoProcessing: boolean;
        programViews: number;
        hasTrackerItem: boolean;
        hasFollow: boolean;
      }>(sql`
        select
          exists(
            select 1 from ${videos} where ${videos.userId} = ${user.id}
          ) as "hasVideo",
          exists(
            select 1 from ${videoUploads}
            where ${videoUploads.userId} = ${user.id}
              and ${videoUploads.status} in ('pending', 'processing')
              and ${videoUploads.createdAt} > ${processingSince}
          ) as "videoProcessing",
          (
            select count(*)::int from ${programViews}
            where ${programViews.dancerId} = ${user.profileId}
              and ${programViews.firstViewedAt} >= ${since}
          ) as "programViews",
          exists(
            select 1 from ${trackerItems}
            where ${trackerItems.dancerId} = ${user.profileId}
              and ${trackerItems.createdAt} >= ${since}
          ) as "hasTrackerItem",
          exists(
            select 1 from ${follows} where ${follows.dancerId} = ${user.profileId}
          ) as "hasFollow"
      `)
    );

    return row!;
  }
}
