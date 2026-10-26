import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { client, type ApiSchemas } from "@/lib/api/client";

export type ReconciliationInvite =
  ApiSchemas["OrgsIdEventsIdReconciliationInvitesResponse"]["data"][number];
export type OrphanRoster =
  ApiSchemas["OrgsIdEventsIdReconciliationOrphansResponse"]["data"][number];

/** Every reconciliation query's key starts with this, so one call refreshes them all. */
export const RECONCILIATION_KEY_PREFIX = ["reconciliation"] as const;

export const reconciliationQueries = {
  /** How many invites and orphan rows each list holds. */
  counts: (slug: string, eventId: string) =>
    queryOptions({
      queryKey: [
        ...RECONCILIATION_KEY_PREFIX,
        slug,
        eventId,
        "counts",
      ] as const,
      queryFn: async ({ signal }) => {
        const { data, error } = await client.GET(
          "/orgs/{slug}/events/{id}/reconciliation/counts",
          { params: { path: { slug, id: eventId } }, signal },
        );
        if (error) throw error;
        return data;
      },
    }),

  /** The event's invites, claimed or not, a page at a time. */
  invitePages: (
    slug: string,
    eventId: string,
    query: { claimed: boolean; search?: string },
    pageSize: number,
  ) =>
    infiniteQueryOptions({
      queryKey: [
        ...RECONCILIATION_KEY_PREFIX,
        slug,
        eventId,
        "invites",
        query,
      ] as const,
      queryFn: async ({ pageParam, signal }) => {
        const { data, error } = await client.GET(
          "/orgs/{slug}/events/{id}/reconciliation/invites",
          {
            params: {
              path: { slug, id: eventId },
              query: { ...query, page: pageParam, limit: pageSize },
            },
            signal,
          },
        );
        if (error) throw error;
        return data;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, pages) =>
        pages.length * pageSize < lastPage.total ? pages.length : undefined,
    }),

  /** Coach rows with no account and no invite, a page at a time. */
  orphanPages: (
    slug: string,
    eventId: string,
    query: { search?: string },
    pageSize: number,
  ) =>
    infiniteQueryOptions({
      queryKey: [
        ...RECONCILIATION_KEY_PREFIX,
        slug,
        eventId,
        "orphans",
        query,
      ] as const,
      queryFn: async ({ pageParam, signal }) => {
        const { data, error } = await client.GET(
          "/orgs/{slug}/events/{id}/reconciliation/orphans",
          {
            params: {
              path: { slug, id: eventId },
              query: { ...query, page: pageParam, limit: pageSize },
            },
            signal,
          },
        );
        if (error) throw error;
        return data;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, pages) =>
        pages.length * pageSize < lastPage.total ? pages.length : undefined,
    }),
};
