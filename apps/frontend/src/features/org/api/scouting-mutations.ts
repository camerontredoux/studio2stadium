import {
  type QueryClient,
  type QueryKey,
  useQueryClient,
} from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast-manager";
import { $api, type ApiSchemas } from "@/lib/api/client";
import { scoutingQueries } from "./scouting-queries";

export function useUpsertRating(slug: string) {
  return $api.useMutation(
    "put",
    "/orgs/{slug}/dancers/{dancerRosterId}/rating",
    {
      meta: {
        invalidateQueries: [scoutingQueries.rankings(slug).queryKey],
      },
    },
  );
}

export function useUpsertNote(slug: string) {
  return $api.useMutation(
    "put",
    "/orgs/{slug}/dancers/{dancerRosterId}/notes",
    {
      meta: {
        invalidateQueries: [scoutingQueries.rankings(slug).queryKey],
      },
    },
  );
}

export function useDeleteNote(slug: string) {
  return $api.useMutation(
    "delete",
    "/orgs/{slug}/dancers/{dancerRosterId}/notes",
    {
      meta: {
        invalidateQueries: [scoutingQueries.rankings(slug).queryKey],
      },
    },
  );
}

export function useAddSchoolSelection(slug: string) {
  return $api.useMutation("post", "/orgs/{slug}/my-selections", {
    meta: {
      invalidateQueries: [scoutingQueries.mySelections(slug).queryKey],
    },
  });
}

export function useRemoveSchoolSelection(slug: string) {
  return $api.useMutation("delete", "/orgs/{slug}/my-selections/{id}", {
    meta: {
      invalidateQueries: [scoutingQueries.mySelections(slug).queryKey],
    },
  });
}

/**
 * Swaps a top choice with its neighbour; the response is the new order. The
 * caller owns the cache: it updates optimistically and refetches once a run of
 * moves has settled, so an early refetch can't undo a later move on screen.
 */
export function useMoveSchoolSelection() {
  return $api.useMutation("post", "/orgs/{slug}/my-selections/{id}/move");
}

/* ------------------------------------------------------------------ */
/*  Coach scouting marks with optimistic updates                       */
/* ------------------------------------------------------------------ */

type DancerPage = ApiSchemas["OrgsIdDancersResponse"];
type DancerRow = DancerPage["data"][number];
type DancerDetail = ApiSchemas["OrgsIdDancersIdResponse"];
type CallbackRow = ApiSchemas["OrgsIdCallbacksResponse"][number];
type RankingRow = ApiSchemas["OrgsIdRankingsResponse"][number];

/** Query-key prefixes that match every cached variant (any params) of a scouting read. */
const scoutingKeys = {
  dancers: ["get", "/orgs/{slug}/dancers"],
  dancer: ["get", "/orgs/{slug}/dancers/{rosterId}"],
  favorites: ["get", "/orgs/{slug}/favorites"],
  callbacks: ["get", "/orgs/{slug}/callbacks"],
  rankings: ["get", "/orgs/{slug}/rankings"],
} as const satisfies Record<string, QueryKey>;

type CacheSnapshot = Array<[QueryKey, unknown]>;

type DancerPages = { pages: DancerPage[]; pageParams: unknown[] };
type DancerListData = DancerPage | DancerPages;

function isDancerPage(data: unknown): data is DancerPage {
  return !!data && Array.isArray((data as DancerPage).data);
}

function isDancerPages(data: unknown): data is DancerPages {
  return !!data && Array.isArray((data as DancerPages).pages);
}

/** The filter tab a cached dancer list was fetched with, read from its key. */
function listFilter(queryKey: QueryKey) {
  const init = queryKey[2] as
    | { params?: { query?: { filter?: string | null } } }
    | undefined;
  return init?.params?.query?.filter ?? "all";
}

function belongs(row: DancerRow, filter: string) {
  if (filter === "favorites") return row.isFavorited;
  if (filter === "calledBack") return row.isCalledBack;
  if (filter === "rated") return (row.rating ?? 0) > 0;
  return true;
}

/**
 * Rewrites the rows of every cached dancer list, whether a single page or the
 * paged list. A row the change takes out of a filtered list (unfavoriting on
 * the Favorites tab) leaves it now; one it would add arrives with the refetch,
 * since only the server knows where it sorts.
 */
export function updateDancerLists(
  qc: QueryClient,
  update: (row: DancerRow) => DancerRow,
) {
  for (const [queryKey, data] of qc.getQueriesData<DancerListData>({
    queryKey: scoutingKeys.dancers,
  })) {
    const filter = listFilter(queryKey);
    const updatePage = (page: DancerPage): DancerPage => {
      let removed = 0;
      const rows = page.data.flatMap((row) => {
        const next = update(row);
        if (belongs(row, filter) && !belongs(next, filter)) {
          removed += 1;
          return [];
        }
        return [next];
      });
      return { ...page, data: rows, total: page.total - removed };
    };
    if (isDancerPage(data)) qc.setQueryData(queryKey, updatePage(data));
    else if (isDancerPages(data))
      qc.setQueryData(queryKey, { ...data, pages: data.pages.map(updatePage) });
  }
}

/** Every dancer row the cached lists hold. */
function cachedDancerRows(qc: QueryClient) {
  return qc
    .getQueriesData<DancerListData>({ queryKey: scoutingKeys.dancers })
    .flatMap(([, data]) =>
      isDancerPage(data)
        ? data.data
        : isDancerPages(data)
          ? data.pages.flatMap((page) => page.data)
          : [],
    );
}

/**
 * Patches one dancer in every cached dancer list, dancer detail, ranking list
 * and callback list, and returns what was there so `restoreScoutingCaches`
 * can undo it. Cancels in-flight reads first so they can't overwrite the patch.
 */
export async function patchScoutedDancer(
  qc: QueryClient,
  rosterId: string,
  patch: Partial<
    Pick<DancerRow, "isFavorited" | "isCalledBack" | "rating" | "hasNote">
  >,
): Promise<CacheSnapshot> {
  const prefixes = [
    scoutingKeys.dancers,
    scoutingKeys.dancer,
    scoutingKeys.rankings,
    scoutingKeys.callbacks,
  ];
  await Promise.all(prefixes.map((queryKey) => qc.cancelQueries({ queryKey })));
  const snapshot = prefixes.flatMap((queryKey) =>
    qc.getQueriesData({ queryKey }),
  );

  const patchRow = <T extends { rosterId: string }>(row: T): T =>
    row.rosterId === rosterId ? { ...row, ...patch } : row;

  updateDancerLists(qc, patchRow);
  qc.setQueriesData<DancerDetail>({ queryKey: scoutingKeys.dancer }, (old) =>
    old && !Array.isArray(old) ? patchRow(old) : old,
  );
  const {
    hasNote: _hasNote,
    isCalledBack: _isCalledBack,
    ...rankingPatch
  } = patch;
  qc.setQueriesData<RankingRow[]>({ queryKey: scoutingKeys.rankings }, (old) =>
    Array.isArray(old)
      ? old.map((row) =>
          row.rosterId === rosterId ? { ...row, ...rankingPatch } : row,
        )
      : old,
  );
  if ("rating" in patch) {
    qc.setQueriesData<CallbackRow[]>(
      { queryKey: scoutingKeys.callbacks },
      (old) =>
        Array.isArray(old)
          ? old.map((row) =>
              row.rosterId === rosterId
                ? { ...row, rating: patch.rating ?? null }
                : row,
            )
          : old,
    );
  }
  return snapshot;
}

/** Puts back the caches a failed optimistic write changed. */
export function restoreScoutingCaches(
  qc: QueryClient,
  snapshot: CacheSnapshot | undefined,
) {
  for (const [queryKey, data] of snapshot ?? [])
    qc.setQueryData(queryKey, data);
}

/** The cached summary of a dancer (from any dancer list or detail), for optimistic list inserts. */
function cachedDancer(qc: QueryClient, rosterId: string) {
  const row = cachedDancerRows(qc).find((d) => d.rosterId === rosterId);
  if (row) return row;
  for (const [, data] of qc.getQueriesData<DancerDetail>({
    queryKey: scoutingKeys.dancer,
  })) {
    if (data && !Array.isArray(data) && data.rosterId === rosterId) return data;
  }
  return undefined;
}

function summaryOf(dancer: DancerRow | DancerDetail): CallbackRow {
  return {
    rosterId: dancer.rosterId,
    bibNumber: dancer.bibNumber,
    firstName: dancer.firstName,
    lastName: dancer.lastName,
    profilePhotoUrl: dancer.profilePhotoUrl,
    gradYear: dancer.gradYear,
    studio: dancer.studio,
    state: dancer.state,
    gpa: dancer.gpa,
    rating: dancer.rating,
  };
}

async function patchSummaryList(
  qc: QueryClient,
  queryKey: QueryKey,
  rosterId: string,
  add: boolean,
): Promise<CacheSnapshot> {
  await qc.cancelQueries({ queryKey });
  const snapshot = qc.getQueriesData({ queryKey });
  const dancer = add ? cachedDancer(qc, rosterId) : undefined;
  qc.setQueriesData<CallbackRow[]>({ queryKey }, (old) => {
    if (!Array.isArray(old)) return old;
    const rest = old.filter((row) => row.rosterId !== rosterId);
    if (!add) return rest;
    return dancer ? [...rest, summaryOf(dancer)] : old;
  });
  return snapshot;
}

type OptimisticContext = { snapshot: CacheSnapshot };

const scoutingInvalidations: QueryKey[] = [
  scoutingKeys.dancers,
  scoutingKeys.dancer,
  scoutingKeys.favorites,
  scoutingKeys.rankings,
];

/** Favorite a dancer for the coach's active event; every dancer list and the favorites update at once. */
export function useAddFavorite() {
  const qc = useQueryClient();
  return $api.useMutation("post", "/orgs/{slug}/favorites", {
    onMutate: async ({ body }): Promise<OptimisticContext> => {
      const id = body?.dancerRosterId;
      if (!id) return { snapshot: [] };
      const snapshot = [
        ...(await patchScoutedDancer(qc, id, { isFavorited: true })),
        ...(await patchSummaryList(qc, scoutingKeys.favorites, id, true)),
      ];
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      restoreScoutingCaches(
        qc,
        (context as OptimisticContext | undefined)?.snapshot,
      );
      toastManager.add({ title: "Couldn't favorite dancer", type: "error" });
    },
    meta: { invalidateQueries: scoutingInvalidations },
  });
}

/** Unfavorite a dancer; the reverse of `useAddFavorite`. */
export function useRemoveFavorite() {
  const qc = useQueryClient();
  return $api.useMutation("delete", "/orgs/{slug}/favorites/{dancerRosterId}", {
    onMutate: async ({ params }): Promise<OptimisticContext> => {
      const id = params.path.dancerRosterId;
      const snapshot = [
        ...(await patchScoutedDancer(qc, id, { isFavorited: false })),
        ...(await patchSummaryList(qc, scoutingKeys.favorites, id, false)),
      ];
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      restoreScoutingCaches(
        qc,
        (context as OptimisticContext | undefined)?.snapshot,
      );
      toastManager.add({ title: "Couldn't remove favorite", type: "error" });
    },
    meta: { invalidateQueries: scoutingInvalidations },
  });
}

/** Call a dancer back in the current showcase; the dancer lists and the callbacks list update at once. */
export function useAddCallback() {
  const qc = useQueryClient();
  return $api.useMutation("post", "/orgs/{slug}/callbacks", {
    onMutate: async ({ body }): Promise<OptimisticContext> => {
      const id = body?.dancerRosterId;
      if (!id) return { snapshot: [] };
      const snapshot = [
        ...(await patchScoutedDancer(qc, id, { isCalledBack: true })),
        ...(await patchSummaryList(qc, scoutingKeys.callbacks, id, true)),
      ];
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      restoreScoutingCaches(
        qc,
        (context as OptimisticContext | undefined)?.snapshot,
      );
      toastManager.add({ title: "Couldn't add callback", type: "error" });
    },
    meta: {
      invalidateQueries: [...scoutingInvalidations, scoutingKeys.callbacks],
    },
  });
}

/** Take back a callback; the reverse of `useAddCallback`. */
export function useRemoveCallback() {
  const qc = useQueryClient();
  return $api.useMutation("delete", "/orgs/{slug}/callbacks/{dancerRosterId}", {
    onMutate: async ({ params }): Promise<OptimisticContext> => {
      const id = params.path.dancerRosterId;
      const snapshot = [
        ...(await patchScoutedDancer(qc, id, { isCalledBack: false })),
        ...(await patchSummaryList(qc, scoutingKeys.callbacks, id, false)),
      ];
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      restoreScoutingCaches(
        qc,
        (context as OptimisticContext | undefined)?.snapshot,
      );
      toastManager.add({ title: "Couldn't remove callback", type: "error" });
    },
    meta: {
      invalidateQueries: [...scoutingInvalidations, scoutingKeys.callbacks],
    },
  });
}
