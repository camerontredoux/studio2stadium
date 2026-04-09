import { $api } from "@/lib/api/client";

export const scoutingQueries = {
  dancers: (
    slug: string,
    params: {
      search?: string;
      bib?: number;
      limit?: number;
      offset?: number;
    } = {},
  ) =>
    $api.queryOptions("get", "/orgs/{slug}/dancers", {
      params: {
        path: { slug },
        query: params,
      },
    }),
  dancer: (slug: string, rosterId: string) =>
    $api.queryOptions("get", "/orgs/{slug}/dancers/{rosterId}", {
      params: { path: { slug, rosterId } },
    }),
  favorites: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/favorites", {
      params: { path: { slug } },
    }),
  rankings: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/rankings", {
      params: { path: { slug } },
    }),
};
