import { queryOptions } from "@tanstack/react-query";
import { client } from "@/lib/api/client";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await (client as unknown as Record<string, (p: string) => Promise<{ data: T }>>)["GET"](path);
  return res.data;
}

export type OrgEvent = {
  id: string;
  name: string;
  isActive: boolean;
};

export type OrgEventStats = {
  coaches: number;
  dancers: number;
  registered: number;
  pending: number;
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
