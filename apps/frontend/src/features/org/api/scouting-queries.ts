import { infiniteQueryOptions } from "@tanstack/react-query";

import { $api, client } from "@/lib/api/client";
import type { paths } from "@/lib/api/types";

export type DancerListParams = NonNullable<
  paths["/orgs/{slug}/dancers"]["get"]["parameters"]["query"]
>;

/** Bib chips per page of a showcase's callbacks. */
const CALLBACK_PAGE_SIZE = 100;

/** Schools per page of the dancer's Top choices list. */
export const SCHOOL_PAGE_SIZE = 50;

/** Every paged schools query's key starts with this. */
export const SCHOOL_PAGES_KEY_PREFIX = [
  "get",
  "/orgs/{slug}/schools/page",
] as const;

/** Every admin callback-board query's key starts with this. */
export const ADMIN_CALLBACKS_KEY_PREFIX = [
  "get",
  "/orgs/{slug}/admin/callbacks",
] as const;

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
  /** The org's schools a page at a time, by name, narrowed by `search`. */
  schoolPages: (slug: string, eventId?: string, search = "") =>
    infiniteQueryOptions({
      queryKey: [
        ...SCHOOL_PAGES_KEY_PREFIX,
        { params: { path: { slug }, query: { eventId, search } } },
        "pages",
      ] as const,
      queryFn: async ({ pageParam, signal }) => {
        const { data, error } = await client.GET("/orgs/{slug}/schools/page", {
          params: {
            path: { slug },
            query: {
              eventId,
              search: search || undefined,
              page: pageParam,
              limit: SCHOOL_PAGE_SIZE,
            },
          },
          signal,
        });
        if (error) throw error;
        return data;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, pages) =>
        pages.length * SCHOOL_PAGE_SIZE < lastPage.total
          ? pages.length
          : undefined,
    }),
  mySelections: (slug: string, eventId?: string) =>
    $api.queryOptions("get", "/orgs/{slug}/my-selections", {
      params: { path: { slug }, query: { eventId } },
    }),
  callbacks: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/callbacks", {
      params: { path: { slug } },
    }),
  /** The coach's callbacks by showcase on the active event, newest showcase first. */
  callbackHistory: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/callbacks/history", {
      params: { path: { slug } },
    }),
  /** The current showcase's called-back dancers a page at a time, in bib order. */
  adminCallbackPages: (slug: string) =>
    infiniteQueryOptions({
      queryKey: [
        ...ADMIN_CALLBACKS_KEY_PREFIX,
        { params: { path: { slug } } },
        "pages",
      ] as const,
      queryFn: async ({ pageParam, signal }) => {
        const { data, error } = await client.GET(
          "/orgs/{slug}/admin/callbacks",
          {
            params: {
              path: { slug },
              query: { page: pageParam, limit: CALLBACK_PAGE_SIZE },
            },
            signal,
          },
        );
        if (error) throw error;
        return data;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, pages) =>
        pages.length * CALLBACK_PAGE_SIZE < lastPage.uniqueCallbacks
          ? pages.length
          : undefined,
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
    $api.queryOptions(
      "get",
      "/orgs/{slug}/dancers/{dancerRosterId}/callbacks",
      {
        params: { path: { slug, dancerRosterId }, query: { eventId } },
      },
    ),
  /** A published showcase's dancers a page at a time, in bib order. */
  publishedCallbackPages: (slug: string, showcaseId: string) =>
    infiniteQueryOptions({
      queryKey: [
        "get",
        "/orgs/{slug}/showcases/{showcaseId}/callbacks",
        { params: { path: { slug, showcaseId } } },
        "pages",
      ] as const,
      queryFn: async ({ pageParam, signal }) => {
        const { data, error } = await client.GET(
          "/orgs/{slug}/showcases/{showcaseId}/callbacks",
          {
            params: {
              path: { slug, showcaseId },
              query: { page: pageParam, limit: CALLBACK_PAGE_SIZE },
            },
            signal,
          },
        );
        if (error) throw error;
        return data;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, pages) =>
        pages.length * CALLBACK_PAGE_SIZE < lastPage.total
          ? pages.length
          : undefined,
    }),
};
