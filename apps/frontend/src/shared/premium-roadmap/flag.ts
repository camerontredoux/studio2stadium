import { useFeatureFlagEnabled } from "posthog-js/react";

/** PostHog feature flag for the Recruiting Roadmap and Recruiting Tracker. */
export const RECRUITING_TRACKER_FLAG = "recruiting-tracker";

/**
 * Whether the dancer sees the roadmap card, the tracker page, and its nav
 * link. Undefined while PostHog loads flags. PostHog only runs in production
 * builds, so dev builds always see the feature.
 */
export function useRecruitingTrackerEnabled(): boolean | undefined {
  const enabled = useFeatureFlagEnabled(RECRUITING_TRACKER_FLAG);
  return import.meta.env.PROD ? enabled : true;
}
