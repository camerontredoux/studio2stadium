import type { QueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api/client";
import type { components } from "@/lib/api/types";

/**
 * An Org Event from `GET /orgs/{slug}/events`. `startTime`–`endTime` are the
 * daily hours ("HH:mm", every day of the event) in `timezone`. `startsAt` and
 * `endsAt` are the first day's start and the last day's end as ISO instants,
 * and `effectiveTimezone` is the zone they were computed in (the event's, else
 * the org default, else UTC). The backend computes them; read phase and time
 * from them rather than from the dates.
 */
export type OrgEvent = components["schemas"]["OrgsIdEventsResponse"][number];

export type CsvUploadSummary = {
  id: string;
  eventId: string;
  type: "coach" | "dancer";
  rowsAdded: number;
  rowsUpdated: number;
  rowsErrored: number;
  createdAt: string;
};

export type RosterSplit = {
  activated: number;
  pending: number;
  total: number;
};

export type OrgEventStats = {
  coaches: RosterSplit;
  dancers: RosterSplit;
  /** Cross-role total activated (backward compat) */
  registered: number;
  /** Cross-role total pending (backward compat) */
  pending: number;
  recentUploads: CsvUploadSummary[];
};

export type ChecklistItem = {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

// The spec types /stats with a different shape than the backend returns, so
// this reads the data as the hand-written type above.
const asOrgEventStats = (data: unknown) => data as OrgEventStats;

export const adminQueries = {
  events: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/events", {
      params: { path: { slug } },
    }),
  stats: (slug: string, eventId: string) =>
    $api.queryOptions(
      "get",
      "/orgs/{slug}/events/{id}/stats",
      { params: { path: { slug, id: eventId } } },
      { select: asOrgEventStats },
    ),
  checklist: (slug: string, eventId: string) =>
    $api.queryOptions("get", "/orgs/{slug}/events/{id}/checklist", {
      params: { path: { slug, id: eventId } },
    }),
};

// The event-scoped queries used to share the key prefix
// ["orgs", slug, "events"], so invalidating the event list also refreshed
// every event's stats, checklist, check-in status and videos. This keeps that.
const ORG_EVENT_QUERY_PATHS = new Set<unknown>([
  "/orgs/{slug}/events",
  "/orgs/{slug}/events/{id}/stats",
  "/orgs/{slug}/events/{id}/checklist",
  "/orgs/{slug}/events/{id}/check-in/status",
  "/orgs/{slug}/events/{id}/video-categories",
  "/orgs/{slug}/events/{id}/videos",
]);

/**
 * Refresh after the org's live Org Event changes. Many org routes resolve the
 * live event on the server (the org's `myRoster`, schools, callbacks, claims,
 * scouting), so their cached answers belong to the old event even when their
 * key has no event id. Refreshing everything is simpler than tracking them.
 */
export function invalidateAfterLiveEventChange(qc: QueryClient) {
  return qc.invalidateQueries();
}

export function invalidateOrgEvents(qc: QueryClient, slug: string) {
  return qc.invalidateQueries({
    predicate: ({ queryKey: [method, path, init] }) =>
      method === "get" &&
      ORG_EVENT_QUERY_PATHS.has(path) &&
      (init as { params?: { path?: { slug?: string } } } | undefined)?.params
        ?.path?.slug === slug,
  });
}
