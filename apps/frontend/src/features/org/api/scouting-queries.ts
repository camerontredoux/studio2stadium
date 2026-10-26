import { infiniteQueryOptions } from "@tanstack/react-query";

import { $api, client } from "@/lib/api/client";
import type { paths } from "@/lib/api/types";

export type DancerListParams = NonNullable<
  paths["/orgs/{slug}/dancers"]["get"]["parameters"]["query"]
>;

/** Rows per page of the coach's dancer list. */
export const DANCER_PAGE_SIZE = 50;

export const scoutingQueries = {
  /** One page of the coach's dancers (the first, unless `page` is set). */
  dancers: (slug: string, params: DancerListParams = {}) =>
    $api.queryOptions("get", "/orgs/{slug}/dancers", {
      params: {
        path: { slug },
        query: params,
      },
    }),
  /**
   * The coach's dancers a page at a time. The key extends `dancers`' key, so
   * every patch and invalidation aimed at the dancer lists reaches it too.
   */
  dancerPages: (
    slug: string,
    params: Omit<DancerListParams, "page" | "limit"> = {},
  ) => {
    const query = { ...params, limit: DANCER_PAGE_SIZE };
    return infiniteQueryOptions({
      queryKey: [
        "get",
        "/orgs/{slug}/dancers",
        { params: { path: { slug }, query } },
        "pages",
      ] as const,
      queryFn: async ({ pageParam, signal }) => {
        const { data, error } = await client.GET("/orgs/{slug}/dancers", {
          params: { path: { slug }, query: { ...query, page: pageParam } },
          signal,
        });
        if (error) throw error;
        return data;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, pages) =>
        pages.length * DANCER_PAGE_SIZE < lastPage.total
          ? pages.length
          : undefined,
    });
  },
  dancer: (slug: string, rosterId: string, eventId?: string) =>
    $api.queryOptions("get", "/orgs/{slug}/dancers/{rosterId}", {
      params: { path: { slug, rosterId }, query: { eventId } },
    }),
  favorites: (slug: string, eventId?: string) =>
    $api.queryOptions("get", "/orgs/{slug}/favorites", {
      params: { path: { slug }, query: { eventId } },
    }),
  rankings: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/rankings", {
      params: { path: { slug } },
    }),
  schools: (slug: string, eventId?: string) =>
    $api.queryOptions("get", "/orgs/{slug}/schools", {
      params: { path: { slug }, query: { eventId } },
    }),
  mySelections: (slug: string, eventId?: string) =>
    $api.queryOptions("get", "/orgs/{slug}/my-selections", {
      params: { path: { slug }, query: { eventId } },
    }),
  callbacks: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/callbacks", {
      params: { path: { slug } },
    }),
  adminCallbacks: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/admin/callbacks", {
      params: { path: { slug } },
    }),
  showcases: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/showcases", {
      params: { path: { slug } },
    }),
  dancerCallbacks: (slug: string, eventId?: string) =>
    $api.queryOptions("get", "/orgs/{slug}/dancer/callbacks", {
      params: { path: { slug }, query: { eventId } },
    }),
  publishPreview: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/showcases/publish-preview", {
      params: { path: { slug } },
    }),
  dancerCallbackDetail: (slug: string, dancerRosterId: string) =>
    $api.queryOptions(
      "get",
      "/orgs/{slug}/admin/dancers/{dancerRosterId}/callbacks",
      {
        params: { path: { slug, dancerRosterId } },
      },
    ),
  // A coach's own-program view of a dancer's callbacks — scoped server-side to
  // the requesting coach, so it never reveals other programs' callbacks.
  // eventId re-resolves the coach's roster for a past event being browsed.
  coachDancerCallbackDetail: (
    slug: string,
    dancerRosterId: string,
    eventId?: string,
  ) =>
    $api.queryOptions("get", "/orgs/{slug}/dancers/{dancerRosterId}/callbacks", {
      params: { path: { slug, dancerRosterId }, query: { eventId } },
    }),
  publishedCallbacks: (slug: string, showcaseId: string) =>
    $api.queryOptions("get", "/orgs/{slug}/showcases/{showcaseId}/callbacks", {
      params: { path: { slug, showcaseId } },
    }),
};
