import { follows, programViews } from "#database/schema/profiles";
import { videos, videoUploads } from "#database/schema/media";
import { premiumRoadmaps, subscriptions } from "#database/schema/subscriptions";
import { trackerItems } from "#database/schema/tracker";
import { DatabaseService } from "#database/service";
import { Service as ProfileChecklistService } from "#modules/dancers/profile/get-profile-checklist/service";
import env from "#start/env";
import { inject } from "@adonisjs/core";
import { and, eq, gt, isNotNull, sql } from "drizzle-orm";

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
  interval: "monthly" | "annual" | null;
  completedCount: number;
  totalCount: number;
  // First time all five steps were complete.
  completedAt: Date | null;
  firstViewedAt: Date;
  steps: RoadmapStep[];
}

// `roadmap` is null exactly when `eligible` is false.
export interface Roadmap {
  eligible: boolean;
  roadmap: RoadmapDetails | null;
}

const INELIGIBLE: Roadmap = { eligible: false, roadmap: null };

/**
 * Paying Stripe Premium right now. Org-granted Premium (premium_grants) is
 * deliberately excluded: the roadmap is for members who pay.
 */
export function paidPremium(now: Date) {
  return and(
    eq(subscriptions.source, "stripe"),
    eq(subscriptions.status, "active"),
    gt(subscriptions.currentPeriodEnd, now),
    isNotNull(subscriptions.startedAt)
  );
}

export function subscriptionInterval(priceId: string | null) {
  if (priceId === env.get("STRIPE_PRICE_ID_MONTHLY")) return "monthly";
  if (priceId === env.get("STRIPE_PRICE_ID_YEARLY")) return "annual";
  return null;
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

  async execute(user: { id: string; profileId: string }): Promise<Roadmap> {
    if (!env.get("PREMIUM_ROADMAP_ENABLED")) return INELIGIBLE;

    const now = new Date();

    const [membership] = await this.db.use((db) =>
      db
        .select({
          startedAt: subscriptions.startedAt,
          priceId: subscriptions.priceId,
          roadmapStartedAt: premiumRoadmaps.premiumStartedAt,
        })
        .from(subscriptions)
        .leftJoin(premiumRoadmaps, eq(premiumRoadmaps.userId, user.id))
        .where(and(eq(subscriptions.userId, user.id), paidPremium(now)))
        .limit(1)
    );

    if (!membership?.startedAt) return INELIGIBLE;

    // Members who started before the roadmap existed only get one if they
    // are still inside their first 30 days.
    const premiumStartedAt =
      membership.roadmapStartedAt ?? membership.startedAt;
    if (
      !membership.roadmapStartedAt &&
      now.getTime() - premiumStartedAt.getTime() > ROADMAP_DAYS * DAY_MS
    ) {
      return INELIGIBLE;
    }

    const [checklist, facts] = await Promise.all([
      this.profileChecklist.execute(user.profileId),
      this.stepFacts(user, premiumStartedAt, now),
    ]);

    const done = {
      profile: !!checklist && Object.values(checklist).every(Boolean),
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

    return {
      eligible: true,
      roadmap: {
        version: roadmap.roadmapVersion,
        premiumStartedAt: roadmap.premiumStartedAt,
        daysSinceStart: Math.floor(
          (now.getTime() - roadmap.premiumStartedAt.getTime()) / DAY_MS
        ),
        interval: subscriptionInterval(membership.priceId),
        completedCount: steps.filter((step) => step.status === "complete")
          .length,
        totalCount: steps.length,
        completedAt: roadmap.roadmapCompletedAt,
        firstViewedAt: roadmap.firstViewedAt!,
        steps,
      },
    };
  }

  // Everything except the profile checklist, in one round trip.
  private async stepFacts(
    user: { id: string; profileId: string },
    premiumStartedAt: Date,
    now: Date
  ) {
    // Raw sql params go to postgres-js untyped, so pass dates as ISO text.
    const processingSince = new Date(
      now.getTime() - PROCESSING_WINDOW_MS
    ).toISOString();
    const since = premiumStartedAt.toISOString();

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
