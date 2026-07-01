import { $api, client, type ApiSchemas } from "@/lib/api/client";

export type RosterType = "dancer" | "coach";
export type RosterStatus = "all" | "active" | "pending";

export type RosterEntry =
  ApiSchemas["OrgsIdEventsIdRostersResponse"]["data"][number];
export type DancerProfile = NonNullable<RosterEntry["profile"]>;

export interface RosterListParams {
  type: RosterType;
  page?: number;
  limit?: number;
  search?: string;
  status?: RosterStatus;
  org?: string;
  sortBy?:
    | "lastName"
    | "firstName"
    | "email"
    | "bibNumber"
    | "organization"
    | "createdAt"
    | "isRegistered"
    | "checkedInAt";
  sortDir?: "asc" | "desc";
}

/**
 * openapi-react-query generates query keys as [method, path, init]. Passing
 * a two-element prefix [method, path] to TanStack Query's invalidateQueries
 * matches every variation of that endpoint regardless of params, so a single
 * mutation can invalidate every roster list query on the page.
 */
const ROSTER_LIST_KEY_PREFIX = [
  "get",
  "/orgs/{slug}/events/{id}/rosters",
] as const;
const ROSTER_FILTERS_KEY_PREFIX = [
  "get",
  "/orgs/{slug}/events/{id}/rosters/filters",
] as const;
const ROSTER_STATS_KEY_PREFIX = [
  "get",
  "/orgs/{slug}/events/{id}/rosters/stats",
] as const;

export const rosterQueries = {
  list: (slug: string, eventId: string, params: RosterListParams) =>
    $api.queryOptions("get", "/orgs/{slug}/events/{id}/rosters", {
      params: {
        path: { slug, id: eventId },
        query: params,
      },
    }),
  filters: (slug: string, eventId: string, type: RosterType) =>
    $api.queryOptions("get", "/orgs/{slug}/events/{id}/rosters/filters", {
      params: {
        path: { slug, id: eventId },
        query: { type },
      },
    }),
  stats: (slug: string, eventId: string, type: RosterType) =>
    $api.queryOptions("get", "/orgs/{slug}/events/{id}/rosters/stats", {
      params: {
        path: { slug, id: eventId },
        query: { type },
      },
    }),
};

export function useUpdateRoster() {
  return $api.useMutation(
    "patch",
    "/orgs/{slug}/events/{id}/rosters/{rosterId}",
    {
      meta: {
        invalidateQueries: [
          ROSTER_LIST_KEY_PREFIX,
          ROSTER_FILTERS_KEY_PREFIX,
          ROSTER_STATS_KEY_PREFIX,
        ],
      },
    },
  );
}

export function useSetRosterPaid() {
  return $api.useMutation(
    "patch",
    "/orgs/{slug}/events/{id}/rosters/{rosterId}/paid",
    {
      meta: {
        invalidateQueries: [
          ROSTER_LIST_KEY_PREFIX,
          ROSTER_STATS_KEY_PREFIX,
        ],
      },
    },
  );
}

export function useDeleteRosters() {
  return $api.useMutation("delete", "/orgs/{slug}/events/{id}/rosters", {
    meta: {
      invalidateQueries: [
        ROSTER_LIST_KEY_PREFIX,
        ROSTER_FILTERS_KEY_PREFIX,
        ROSTER_STATS_KEY_PREFIX,
      ],
    },
  });
}

export function useResendInvites() {
  return $api.useMutation(
    "post",
    "/orgs/{slug}/events/{id}/rosters/resend-invites",
  );
}

export function useAttachAccount() {
  return $api.useMutation(
    "post",
    "/orgs/{slug}/events/{id}/rosters/{rosterId}/attach",
    {
      meta: {
        invalidateQueries: [
          ROSTER_LIST_KEY_PREFIX,
          ROSTER_FILTERS_KEY_PREFIX,
          ROSTER_STATS_KEY_PREFIX,
        ],
      },
    },
  );
}

export const rosterSearchQueries = {
  dancerUsers: (slug: string, eventId: string, q: string) =>
    $api.queryOptions(
      "get",
      "/orgs/{slug}/events/{id}/rosters/search-dancers",
      {
        params: {
          path: { slug, id: eventId },
          query: { q },
        },
      },
    ),
};

/**
 * Client-side CSV download. Hits the export endpoint with parseAs: "text"
 * and triggers a blob download. Not a TanStack Query hook since the result
 * is a file rather than cached data.
 */
export async function downloadRosterCsv(
  slug: string,
  eventId: string,
  params: {
    type: RosterType;
    search?: string;
    status?: RosterStatus;
    org?: string;
  },
): Promise<void> {
  const res = await client.GET("/orgs/{slug}/events/{id}/rosters/export", {
    params: {
      path: { slug, id: eventId },
      query: params,
    },
    parseAs: "text",
  });

  const csv = (res.data as unknown as string) ?? "";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${params.type}s-export.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
