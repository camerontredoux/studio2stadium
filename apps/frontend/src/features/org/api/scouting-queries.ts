import { $api } from "@/lib/api/client";

export const scoutingQueries = {
  dancers: (
    slug: string,
    params: {
      search?: string;
      bib?: number;
      interested?: boolean;
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
  schools: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/schools", {
      params: { path: { slug } },
    }),
  mySelections: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/my-selections", {
      params: { path: { slug } },
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
  dancerCallbacks: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/dancer/callbacks", {
      params: { path: { slug } },
    }),
  publishedCallbacks: (slug: string, showcaseId: string) =>
    $api.queryOptions(
      "get",
      "/orgs/{slug}/showcases/{showcaseId}/callbacks",
      { params: { path: { slug, showcaseId } } },
    ),
};
