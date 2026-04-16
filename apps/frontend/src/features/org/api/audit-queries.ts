import { $api, type ApiSchemas } from "@/lib/api/client";

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

export type AuditListParams = {
  page?: number;
  limit?: number;
  search?: string;
  action?: AuditAction;
  resource?: AuditResource;
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
        query: params,
      },
    }),

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
