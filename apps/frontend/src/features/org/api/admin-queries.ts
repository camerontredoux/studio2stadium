import { queryOptions } from "@tanstack/react-query";
import { client } from "@/lib/api/client";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await (client as unknown as Record<string, (p: string) => Promise<{ data: T }>>)["GET"](path);
  return res.data;
}

export type OrgEvent = {
  id: string;
  orgId: string;
  name: string;
  startDate: string;
  endDate: string;
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

export type OrgEventStats = {
  coaches: number;
  dancers: number;
  registered: number;
  pending: number;
  recentUploads: CsvUploadSummary[];
};

export const adminQueries = {
  events: (slug: string) =>
    queryOptions({
      queryKey: ["orgs", slug, "events"],
      queryFn: () => fetchJson<OrgEvent[]>(`/orgs/${slug}/events`),
    }),
  stats: (slug: string, eventId: string) =>
    queryOptions({
      queryKey: ["orgs", slug, "events", eventId, "stats"],
      queryFn: () => fetchJson<OrgEventStats>(`/orgs/${slug}/events/${eventId}/stats`),
    }),
};
