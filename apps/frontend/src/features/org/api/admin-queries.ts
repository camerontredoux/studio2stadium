import type { QueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api/client";

export type OrgEvent = {
  id: string;
  orgId: string;
  name: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  timezone: string | null;
  venueName: string | null;
  venueAddress: string | null;
  contactEmail: string | null;
  schedulePdfUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

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

// The spec types the event list with the feature-flag schema and /stats with
// a different shape than the backend returns, so these two read the data as
// the hand-written types above.
const asOrgEvents = (data: unknown) => data as OrgEvent[];
const asOrgEventStats = (data: unknown) => data as OrgEventStats;

export const adminQueries = {
  events: (slug: string) =>
    $api.queryOptions(
      "get",
      "/orgs/{slug}/events",
      { params: { path: { slug } } },
      { select: asOrgEvents },
    ),
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

export function invalidateOrgEvents(qc: QueryClient, slug: string) {
  return qc.invalidateQueries({
    predicate: ({ queryKey: [method, path, init] }) =>
      method === "get" &&
      ORG_EVENT_QUERY_PATHS.has(path) &&
      (init as { params?: { path?: { slug?: string } } } | undefined)?.params
        ?.path?.slug === slug,
  });
}
