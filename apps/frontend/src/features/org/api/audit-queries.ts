import { infiniteQueryOptions } from "@tanstack/react-query";

import { $api, client, type ApiSchemas } from "@/lib/api/client";

// ── Derived types from generated OpenAPI schema ────────────────────────────

type ListResponse = ApiSchemas["OrgsIdEventsIdAuditlogResponse"];
type StatsResponse = ApiSchemas["OrgsIdEventsIdAuditlogStatsResponse"];
type ChildrenResponse = ApiSchemas["OrgsIdEventsIdAuditlogIdChildrenResponse"];

// The generated schema types JSONB as Record<string, never>. Override to the
// real runtime shape so consumers can access metadata fields without casting.
type MetadataOverride = Record<string, unknown> | null;

export type AuditLogEntry = Omit<ListResponse["data"][number], "metadata"> & {
  metadata: MetadataOverride;
};

export type AuditLogChildEntry = Omit<
  ChildrenResponse["data"][number],
  "metadata"
> & {
  metadata: MetadataOverride;
};

export type AuditLogStats = StatsResponse;
export type AuditAction = AuditLogEntry["action"];
export type AuditResource = AuditLogEntry["resource"];
export type AuditActor = AuditLogEntry["actor"];
/** An API action, or `check_in`: an update of a roster entry's check-in time. */
export type AuditFilterAction = AuditAction | "check_in";

export type AuditListParams = {
  page?: number;
  limit?: number;
  search?: string;
  /** Entries with any of these actions; an `update` excludes check-ins. */
  actions?: AuditFilterAction[];
  resources?: AuditResource[];
  actorId?: string;
  from?: string;
  to?: string;
  sortDir?: "asc" | "desc";
};

// ── Query factories ────────────────────────────────────────────────────────

export const auditQueries = {
  list: (slug: string, eventId: string, params: AuditListParams) =>
    $api.queryOptions("get", "/orgs/{slug}/events/{id}/audit-log", {
      params: {
        path: { slug, id: eventId },
        query: params as Record<string, unknown>,
      },
    }),

  /** The log a page at a time; the key extends `list`'s. */
  listPages: (
    slug: string,
    eventId: string,
    params: Omit<AuditListParams, "page" | "limit">,
    pageSize: number,
  ) => {
    const query = { ...params, limit: pageSize };
    return infiniteQueryOptions({
      queryKey: [
        "get",
        "/orgs/{slug}/events/{id}/audit-log",
        { params: { path: { slug, id: eventId }, query } },
        "pages",
      ] as const,
      queryFn: ({ pageParam, signal }) =>
        fetchAuditPage(slug, eventId, { ...query, page: pageParam }, signal),
      initialPageParam: 0,
      getNextPageParam: (lastPage, pages) =>
        pages.length * pageSize < lastPage.total ? pages.length : undefined,
    });
  },

  children: (slug: string, eventId: string, entryId: string) =>
    $api.queryOptions(
      "get",
      "/orgs/{slug}/events/{id}/audit-log/{entryId}/children",
      {
        params: {
          path: { slug, id: eventId, entryId },
        },
      },
    ),

  stats: (slug: string, eventId: string) =>
    $api.queryOptions("get", "/orgs/{slug}/events/{id}/audit-log/stats", {
      params: {
        path: { slug, id: eventId },
      },
    }),
};

/** One page of the log, its entries typed with their real metadata. */
export async function fetchAuditPage(
  slug: string,
  eventId: string,
  query: AuditListParams,
  signal?: AbortSignal,
) {
  const { data, error } = await client.GET(
    "/orgs/{slug}/events/{id}/audit-log",
    { params: { path: { slug, id: eventId }, query }, signal },
  );
  if (error) throw error;
  return data as Omit<ListResponse, "data"> & { data: AuditLogEntry[] };
}
