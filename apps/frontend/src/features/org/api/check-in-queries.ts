import { client } from "@/lib/api/client";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

const rawClient = client as unknown as {
  POST: (path: string, opts?: { body?: unknown }) => Promise<{ data: unknown }>;
  GET: (path: string) => Promise<{ data: unknown }>;
};

export type CheckInStatus = {
  checkedInAt: string | null;
  eventStartTime: string | null;
  timezone: string | null;
  canCheckIn: boolean;
};

export const checkInQueries = {
  status: (slug: string, eventId: string) =>
    queryOptions({
      queryKey: ["orgs", slug, "events", eventId, "check-in", "status"],
      queryFn: () =>
        rawClient
          .GET(`/orgs/${slug}/events/${eventId}/check-in/status`)
          .then((r) => r.data as CheckInStatus),
    }),
};

export function useDancerCheckIn(slug: string, eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      rawClient.POST(`/orgs/${slug}/events/${eventId}/check-in`),
    onSuccess: () => {
      qc.invalidateQueries(checkInQueries.status(slug, eventId));
    },
  });
}

export function useAdminCheckInToggle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      slug,
      eventId,
      rosterId,
    }: {
      slug: string;
      eventId: string;
      rosterId: string;
    }) =>
      rawClient.POST(
        `/orgs/${slug}/events/${eventId}/rosters/${rosterId}/check-in`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["get", "/orgs/"] });
    },
  });
}
