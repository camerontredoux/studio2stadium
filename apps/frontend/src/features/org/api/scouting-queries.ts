import { $api } from "@/lib/api/client";

export const scoutingQueries = {
  dancers: (
    slug: string,
    params: {
      search?: string;
      bib?: number;
      interested?: boolean;
      eventId?: string;
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
  publishedCallbacks: (slug: string, showcaseId: string) =>
    $api.queryOptions("get", "/orgs/{slug}/showcases/{showcaseId}/callbacks", {
      params: { path: { slug, showcaseId } },
    }),
};
