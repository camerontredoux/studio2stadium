import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  HeartIcon,
  PencilIcon,
  StarIcon,
  XIcon,
} from "lucide-react";
import { $api } from "@/lib/api/client";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import { DancerTable } from "@/features/org/components/dancer-table/dancer-table";
import { DancerCard } from "@/features/org/components/dancer-table/dancer-card";
import { DancerSheet } from "@/features/org/components/dancer-sheet";
import { DancerFilterToolbar } from "@/features/org/components/dancer-filter-toolbar";
import { useSearchColumns } from "@/features/org/components/dancer-table/use-dancer-columns";
import type { SearchDancerRow } from "@/features/org/components/dancer-table/columns";
import { StatCell, SidebarSection } from "@/features/org/components/dashboard-shared";
import { Rating, RatingItem } from "@/components/ui/rating";
import type { RowSelectionState, SortingState } from "@tanstack/react-table";
import { FloatingActionBar } from "@/features/org/components/floating-action-bar";
import { CompareView } from "@/features/org/components/compare-view";
import { toastManager } from "@/components/ui/toast-manager";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/coach/dancers/",
)({
  component: DancerSearch,
});

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ActivityItem = {
  type: "favorite" | "rate" | "note";
  rosterId: string;
  dancerName: string;
  bibNumber: number | null;
  rating?: number;
  timestamp: Date;
};

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

function DancerSearch() {
  const { orgSlug } = useParams({
    from: "/_org/$orgSlug/_authenticated/coach/dancers/",
  });
  const { org } = useOrg();

  /* --- Filter state --- */
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [gpaFilter, setGpaFilter] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string | null>(null);
  const [interested, setInterested] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [rated, setRated] = useState(false);
  const [hasNotes, setHasNotes] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  useEffect(() => {
    setRowSelection({});
  }, [yearFilter, gpaFilter, stateFilter, interested, favorited, rated, hasNotes]);

  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);

  useEffect(() => {
    if (rated) {
      setSorting([{ id: "rating", desc: true }]);
    } else {
      setSorting([{ id: "name", desc: false }]);
    }
  }, [rated]);

  /* --- Data --- */
  const { data: dancers, isLoading } = useQuery(
    scoutingQueries.dancers(orgSlug, { interested: interested || undefined }),
  );
  const { data: favorites } = useQuery(scoutingQueries.favorites(orgSlug));

  /* --- Compare clipboard --- */
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    if (compareIds.length < 2) setCompareMode(false);
  }, [compareIds.length]);

  const searchRef = useRef<HTMLInputElement>(null);

  /* --- Activity feed --- */
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const addActivity = useCallback((item: Omit<ActivityItem, "timestamp">) => {
    setActivity((prev) => [{ ...item, timestamp: new Date() }, ...prev].slice(0, 5));
  }, []);

  /* --- Sheet --- */
  const [sheetRosterId, setSheetRosterId] = useState<string | null>(null);

  /* --- Favorite toggle (optimistic on dancers list) --- */
  const qc = useQueryClient();
  const dancersKey = scoutingQueries.dancers(orgSlug, { interested: interested || undefined }).queryKey;

  const addFav = $api.useMutation("post", "/orgs/{slug}/favorites", {
    onMutate: async ({ body }) => {
      await qc.cancelQueries({ queryKey: dancersKey });
      const previous = qc.getQueryData(dancersKey);
      qc.setQueryData(dancersKey, (old: any) =>
        Array.isArray(old)
          ? old.map((d: any) =>
              d.rosterId === body?.dancerRosterId ? { ...d, isFavorited: true } : d,
            )
          : old,
      );
      return { previous };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData(dancersKey, ctx.previous);
      toastManager.add({ title: "Couldn't favorite dancer", type: "error" });
    },
    meta: {
      invalidateQueries: [
        scoutingQueries.favorites(orgSlug).queryKey,
        dancersKey,
        scoutingQueries.rankings(orgSlug).queryKey,
      ],
    },
  });

  const removeFav = $api.useMutation("delete", "/orgs/{slug}/favorites/{dancerRosterId}", {
    onMutate: async ({ params }) => {
      await qc.cancelQueries({ queryKey: dancersKey });
      const previous = qc.getQueryData(dancersKey);
      qc.setQueryData(dancersKey, (old: any) =>
        Array.isArray(old)
          ? old.map((d: any) =>
              d.rosterId === params?.path?.dancerRosterId ? { ...d, isFavorited: false } : d,
            )
          : old,
      );
      return { previous };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData(dancersKey, ctx.previous);
      toastManager.add({ title: "Couldn't remove favorite", type: "error" });
    },
    meta: {
      invalidateQueries: [
        scoutingQueries.favorites(orgSlug).queryKey,
        dancersKey,
        scoutingQueries.rankings(orgSlug).queryKey,
      ],
    },
  });

  const upsertRating = $api.useMutation(
    "put",
    "/orgs/{slug}/dancers/{dancerRosterId}/rating",
    {
      onMutate: async ({ params, body }) => {
        await qc.cancelQueries({ queryKey: dancersKey });
        const previous = qc.getQueryData(dancersKey);
        qc.setQueryData(dancersKey, (old: any) =>
          Array.isArray(old)
            ? old.map((d: any) =>
                d.rosterId === params?.path?.dancerRosterId
                  ? { ...d, rating: body?.rating ?? null }
                  : d,
              )
            : old,
        );
        return { previous };
      },
      onError: (_err, _vars, ctx: any) => {
        if (ctx?.previous) qc.setQueryData(dancersKey, ctx.previous);
        toastManager.add({ title: "Couldn't save rating", type: "error" });
      },
      meta: {
        invalidateQueries: [
          dancersKey,
          scoutingQueries.rankings(orgSlug).queryKey,
        ],
      },
    },
  );

  const handleFavoriteToggle = useCallback(
    (rosterId: string, current: boolean) => {
      const dancer = dancers?.find((d) => d.rosterId === rosterId);
      if (current) {
        removeFav.mutate({
          params: { path: { slug: orgSlug, dancerRosterId: rosterId } },
        });
      } else {
        addFav.mutate({
          params: { path: { slug: orgSlug } },
          body: { dancerRosterId: rosterId },
        });
      }
      if (dancer && !current) {
        addActivity({
          type: "favorite",
          rosterId,
          dancerName: `${dancer.firstName} ${dancer.lastName}`,
          bibNumber: dancer.bibNumber,
        });
      }
    },
    [orgSlug, addFav, removeFav, dancers, addActivity],
  );

  const handleRate = useCallback(
    (rosterId: string, rating: number) => {
      const dancer = dancers?.find((d) => d.rosterId === rosterId);
      upsertRating.mutate({
        params: { path: { slug: orgSlug, dancerRosterId: rosterId } },
        body: { rating },
      });
      if (dancer) {
        addActivity({
          type: "rate",
          rosterId,
          dancerName: `${dancer.firstName} ${dancer.lastName}`,
          bibNumber: dancer.bibNumber,
          rating,
        });
      }
    },
    [orgSlug, upsertRating, dancers, addActivity],
  );

  const handleOpenNotes = useCallback(
    (rosterId: string) => {
      setSheetRosterId(rosterId);
    },
    [],
  );

  const columns = useSearchColumns(handleFavoriteToggle, {
    enableSelection: true,
    onRate: handleRate,
    onOpenNotes: handleOpenNotes,
    showRank: rated,
  });

  /* --- Derived filter options --- */
  const availableYears = useMemo(() => {
    const years = new Set(
      (dancers ?? []).map((d) => d.gradYear).filter((y): y is number => y != null),
    );
    return Array.from(years).sort();
  }, [dancers]);

  const availableStates = useMemo(() => {
    const states = new Set(
      (dancers ?? []).map((d) => d.state).filter((s): s is string => s != null),
    );
    return Array.from(states).sort();
  }, [dancers]);

  /* --- Client-side filtering --- */
  const filteredData: SearchDancerRow[] = useMemo(() => {
    let result = (dancers ?? []).map((d) => ({
      ...d,
      isFavorited: d.isFavorited ?? false,
      hasNote: d.hasNote ?? false,
      rating: d.rating ?? null,
      interestedInMySchool: d.interestedInMySchool ?? false,
    }));

    if (yearFilter !== null) {
      result = result.filter((d) => d.gradYear === yearFilter);
    }
    if (gpaFilter !== null) {
      const threshold = parseFloat(gpaFilter);
      if (threshold >= 3.5) {
        result = result.filter((d) => d.gpa != null && d.gpa >= 3.5);
      } else if (threshold >= 3.0) {
        result = result.filter((d) => d.gpa != null && d.gpa >= 3.0 && d.gpa < 3.5);
      } else if (threshold >= 2.5) {
        result = result.filter((d) => d.gpa != null && d.gpa >= 2.5 && d.gpa < 3.0);
      } else {
        result = result.filter((d) => d.gpa != null && d.gpa < 2.5);
      }
    }
    if (stateFilter !== null) {
      result = result.filter((d) => d.state === stateFilter);
    }
    if (favorited) {
      result = result.filter((d) => d.isFavorited);
    }
    if (rated) {
      result = result.filter((d) => d.rating != null);
    }
    if (hasNotes) {
      result = result.filter((d) => d.hasNote);
    }
    return result;
  }, [dancers, yearFilter, gpaFilter, stateFilter, favorited, rated, hasNotes]);

  const selectedRosterIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((k) => rowSelection[k])
      .map((idx) => filteredData[Number(idx)]?.rosterId)
      .filter(Boolean);
  }, [rowSelection, filteredData]);

  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const handleBulkFavorite = useCallback(async () => {
    setIsBulkLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedRosterIds.map((rosterId) => {
          const dancer = dancers?.find((d) => d.rosterId === rosterId);
          if (dancer) {
            addActivity({
              type: "favorite",
              rosterId,
              dancerName: `${dancer.firstName} ${dancer.lastName}`,
              bibNumber: dancer.bibNumber,
            });
          }
          return addFav.mutateAsync({
            params: { path: { slug: orgSlug } },
            body: { dancerRosterId: rosterId },
          });
        }),
      );
      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length > 0) {
        toastManager.add({
          title: `${failures.length} of ${selectedRosterIds.length} favorites failed`,
          type: "error",
        });
      }
    } finally {
      setIsBulkLoading(false);
      setRowSelection({});
    }
  }, [selectedRosterIds, dancers, addFav, orgSlug, addActivity]);

  const handleBulkRate = useCallback(
    async (rating: number) => {
      setIsBulkLoading(true);
      try {
        const results = await Promise.allSettled(
          selectedRosterIds.map((rosterId) => {
            const dancer = dancers?.find((d) => d.rosterId === rosterId);
            if (dancer) {
              addActivity({
                type: "rate",
                rosterId,
                dancerName: `${dancer.firstName} ${dancer.lastName}`,
                bibNumber: dancer.bibNumber,
                rating,
              });
            }
            return upsertRating.mutateAsync({
              params: { path: { slug: orgSlug, dancerRosterId: rosterId } },
              body: { rating },
            });
          }),
        );
        const failures = results.filter((r) => r.status === "rejected");
        if (failures.length > 0) {
          toastManager.add({
            title: `${failures.length} of ${selectedRosterIds.length} ratings failed`,
            type: "error",
          });
        }
      } finally {
        setIsBulkLoading(false);
        setRowSelection({});
      }
    },
    [selectedRosterIds, dancers, upsertRating, orgSlug, addActivity],
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchRef.current?.focus();
      }

      if (e.key === "Escape" && !isInput && selectedRosterIds.length > 0) {
        setRowSelection({});
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedRosterIds.length]);

  /* --- Stats --- */
  const dancerCount = dancers?.length ?? 0;
  const favCount = favorites?.length ?? 0;
  const toReviewCount = (dancers ?? []).filter(
    (d) => !d.isFavorited && d.rating == null && !d.hasNote,
  ).length;
  const avgGpa = useMemo(() => {
    const withGpa = (dancers ?? []).filter((d) => d.gpa != null);
    if (withGpa.length === 0) return "—";
    const avg = withGpa.reduce((sum, d) => sum + d.gpa!, 0) / withGpa.length;
    return avg.toFixed(1);
  }, [dancers]);

  const reviewedCount = dancerCount - toReviewCount;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto xl:flex-row xl:overflow-hidden">
      {/* Main column */}
      <div className="flex min-w-0 flex-col xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-lg font-semibold tracking-tight 2xl:text-xl">
              Dancers
            </h1>
            <span className="text-muted-foreground text-xs tabular-nums 2xl:text-sm">
              {dancerCount} registered
            </span>
          </div>
        </header>

        {compareMode ? (
          <CompareView
            compareIds={compareIds}
            onRemove={(id) =>
              setCompareIds((prev) => prev.filter((c) => c !== id))
            }
            onBack={() => setCompareMode(false)}
            onOpenSheet={(rosterId) => setSheetRosterId(rosterId)}
          />
        ) : (
          <>
            <section
              aria-label="Scouting stats"
              className="border-border flex items-stretch border-y"
            >
              <StatCell label="To Review" value={toReviewCount} accent="blue" />
              <StatCell label="Favorited" value={favCount} />
              <StatCell label="Avg GPA" value={avgGpa} />
            </section>

            <DancerFilterToolbar
              search={search}
              onSearchChange={setSearch}
              yearFilter={yearFilter}
              onYearFilterChange={setYearFilter}
              gpaFilter={gpaFilter}
              onGpaFilterChange={setGpaFilter}
              stateFilter={stateFilter}
              onStateFilterChange={setStateFilter}
              interested={interested}
              onInterestedChange={setInterested}
              favorited={favorited}
              onFavoritedChange={setFavorited}
              rated={rated}
              onRatedChange={setRated}
              hasNotes={hasNotes}
              onHasNotesChange={setHasNotes}
              schoolName={org.name}
              availableYears={availableYears}
              availableStates={availableStates}
              searchRef={searchRef}
            />

            <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
              <DancerTable<SearchDancerRow>
                data={filteredData}
                columns={columns}
                isLoading={isLoading}
                globalFilter={deferredSearch}
                emptyState={
                  <p className="text-muted-foreground text-sm">
                    {deferredSearch
                      ? `No dancers matched "${deferredSearch}".`
                      : "No dancers registered for this event yet."}
                  </p>
                }
                renderCard={(row) => (
                  <DancerCard
                    dancer={row}
                    onClick={() => setSheetRosterId(row.rosterId)}
                  />
                )}
                sorting={sorting}
                onSortingChange={setSorting}
                enableSelection
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
              />
            </div>
          </>
        )}
      </div>

      <FloatingActionBar
        selectedCount={selectedRosterIds.length}
        isVisible={selectedRosterIds.length > 0}
        onFavoriteAll={handleBulkFavorite}
        onRateAll={handleBulkRate}
        onClear={() => setRowSelection({})}
        isLoading={isBulkLoading}
      />

      {/* Sidebar */}
      <ScoutingSidebar
        dancers={dancers ?? []}
        isLoading={isLoading}
        filteredUnreviewedCount={filteredData.filter(
          (d) => !d.isFavorited && d.rating == null && !d.hasNote,
        ).length}
        reviewedCount={reviewedCount}
        totalCount={dancerCount}
        compareIds={compareIds}
        onRemoveCompare={(id) =>
          setCompareIds((prev) => prev.filter((c) => c !== id))
        }
        onViewCompare={() => setCompareMode(true)}
        activity={activity}
        onActivityClick={(rosterId) => setSheetRosterId(rosterId)}
      />

      <DancerSheet
        rosterId={sheetRosterId}
        open={sheetRosterId !== null}
        onOpenChange={(open) => {
          if (!open) setSheetRosterId(null);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */

type DancerData = {
  rosterId: string;
  bibNumber: number | null;
  firstName: string;
  lastName: string;
  gradYear: number | null;
  gpa: number | null;
  state: string | null;
  studio: string | null;
  isFavorited?: boolean;
  rating?: number | null;
  hasNote?: boolean;
};

function ScoutingSidebar({
  dancers,
  isLoading,
  filteredUnreviewedCount,
  reviewedCount,
  totalCount,
  compareIds,
  onRemoveCompare,
  onViewCompare,
  activity,
  onActivityClick,
}: {
  dancers: DancerData[];
  isLoading: boolean;
  filteredUnreviewedCount: number;
  reviewedCount: number;
  totalCount: number;
  compareIds: string[];
  onRemoveCompare: (id: string) => void;
  onViewCompare: () => void;
  activity: ActivityItem[];
  onActivityClick: (rosterId: string) => void;
}) {
  return (
    <aside className="border-border flex w-full shrink-0 flex-col border-t xl:w-[320px] xl:overflow-x-hidden xl:overflow-y-auto xl:border-t-0 xl:border-l">
      <TalentPoolBreakdown dancers={dancers} isLoading={isLoading} />
      <CompareClipboard
        dancers={dancers}
        compareIds={compareIds}
        onRemove={onRemoveCompare}
        onViewCompare={onViewCompare}
      />
      <ScoutingSession
        reviewedCount={reviewedCount}
        totalCount={totalCount}
        filteredUnreviewed={filteredUnreviewedCount}
        activity={activity}
        onActivityClick={onActivityClick}
        isLoading={isLoading}
      />
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar: Talent Pool Breakdown                                     */
/* ------------------------------------------------------------------ */

function TalentPoolBreakdown({ dancers, isLoading }: { dancers: DancerData[]; isLoading?: boolean }) {
  const yearDist = useMemo(() => {
    const counts = new Map<number, number>();
    for (const d of dancers) {
      if (d.gradYear != null) counts.set(d.gradYear, (counts.get(d.gradYear) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, count]) => ({ label: String(year), count }));
  }, [dancers]);

  const gpaDist = useMemo(() => {
    const buckets = [
      { label: "3.5+", min: 3.5, max: Infinity, count: 0 },
      { label: "3.0–3.5", min: 3.0, max: 3.5, count: 0 },
      { label: "2.5–3.0", min: 2.5, max: 3.0, count: 0 },
      { label: "< 2.5", min: 0, max: 2.5, count: 0 },
    ];
    for (const d of dancers) {
      if (d.gpa == null) continue;
      for (const b of buckets) {
        if (d.gpa >= b.min && (b.max === Infinity ? true : d.gpa < b.max)) {
          b.count++;
          break;
        }
      }
    }
    return buckets;
  }, [dancers]);

  const stateDist = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of dancers) {
      if (d.state) counts.set(d.state, (counts.get(d.state) ?? 0) + 1);
    }
    const sorted = Array.from(counts.entries())
      .sort(([, a], [, b]) => b - a);
    const top5 = sorted.slice(0, 5).map(([state, count]) => ({ label: state, count }));
    const remaining = sorted.length - 5;
    return { top5, remaining };
  }, [dancers]);

  if (isLoading) {
    return (
      <SidebarSection title="Talent pool">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, section) => (
            <div key={section} className="flex flex-col gap-1">
              <Skeleton className="mb-1.5 h-2.5 w-16 rounded" />
              {Array.from({ length: 3 }, (_, row) => (
                <div key={row} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-10 rounded" />
                  <Skeleton className="h-1.5 flex-1 rounded-full" />
                  <Skeleton className="h-3 w-6 rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </SidebarSection>
    );
  }

  if (dancers.length === 0) return null;

  return (
    <SidebarSection title="Talent pool">
      <div className="flex flex-col gap-3">
        <DistributionBars label="By year" items={yearDist} total={dancers.length} labelWidth="w-10" />
        <DistributionBars label="By GPA" items={gpaDist} total={dancers.length} labelWidth="w-14" />
        <div>
          <span className="text-muted-foreground mb-1.5 block text-[10px] font-medium tracking-widest uppercase">
            By state
          </span>
          <div className="flex flex-col gap-1">
            {stateDist.top5.map((item) => (
              <BarRow
                key={item.label}
                label={item.label}
                count={item.count}
                max={stateDist.top5[0]?.count ?? 1}
                labelWidth="w-8"
              />
            ))}
            {stateDist.remaining > 0 && (
              <span className="text-muted-foreground text-[10px]">
                +{stateDist.remaining} more
              </span>
            )}
          </div>
        </div>
      </div>
    </SidebarSection>
  );
}

function DistributionBars({
  label,
  items,
  total: _total,
  labelWidth,
}: {
  label: string;
  items: { label: string; count: number }[];
  total: number;
  labelWidth: string;
}) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div>
      <span className="text-muted-foreground mb-1.5 block text-[10px] font-medium tracking-widest uppercase">
        {label}
      </span>
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <BarRow
            key={item.label}
            label={item.label}
            count={item.count}
            max={max}
            labelWidth={labelWidth}
          />
        ))}
      </div>
    </div>
  );
}

function BarRow({
  label,
  count,
  max,
  labelWidth,
}: {
  label: string;
  count: number;
  max: number;
  labelWidth: string;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className={`text-muted-foreground text-xs tabular-nums ${labelWidth}`}>
        {label}
      </span>
      <div className="bg-border relative h-1.5 flex-1 overflow-hidden rounded-full">
        <div className="bg-foreground h-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-medium tabular-nums">{count}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar: Compare Clipboard                                         */
/* ------------------------------------------------------------------ */

function CompareClipboard({
  dancers,
  compareIds,
  onRemove,
  onViewCompare,
}: {
  dancers: DancerData[];
  compareIds: string[];
  onRemove: (id: string) => void;
  onViewCompare: () => void;
}) {
  const pinned = compareIds
    .map((id) => dancers.find((d) => d.rosterId === id))
    .filter((d): d is DancerData => d != null);

  return (
    <SidebarSection title="Compare">
      {pinned.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          Open a dancer and tap Compare to pin them here.
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {pinned.map((d) => (
            <li key={d.rosterId} className="px-0 py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">
                  <span className="text-muted-foreground font-mono text-[10px]">
                    #{d.bibNumber != null ? String(d.bibNumber).padStart(2, "0") : "—"}{" "}
                  </span>
                  {d.firstName} {d.lastName}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(d.rosterId)}
                  className="text-muted-foreground hover:text-foreground p-0.5"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
              <p className="text-muted-foreground text-[10px]">
                {[
                  d.gradYear ? `Class of ${d.gradYear}` : null,
                  d.state,
                  d.gpa != null ? `${d.gpa.toFixed(1)} GPA` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="mt-1 flex items-center gap-2">
                {d.rating != null && (
                  <Rating disabled size="sm" value={d.rating}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <RatingItem key={i} index={i} />
                    ))}
                  </Rating>
                )}
                {d.isFavorited && (
                  <HeartIcon className="size-3 fill-current text-red-500" />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {pinned.length >= 2 && (
        <Button
          variant="default"
          size="sm"
          className="mt-2 w-full"
          onClick={onViewCompare}
        >
          View Comparison
        </Button>
      )}
    </SidebarSection>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar: Your Scouting Session                                     */
/* ------------------------------------------------------------------ */

const ACTIVITY_ICONS = {
  favorite: HeartIcon,
  rate: StarIcon,
  note: PencilIcon,
} as const;

function ScoutingSession({
  reviewedCount,
  totalCount,
  filteredUnreviewed,
  activity,
  onActivityClick,
  isLoading,
}: {
  reviewedCount: number;
  totalCount: number;
  filteredUnreviewed: number;
  activity: ActivityItem[];
  onActivityClick: (rosterId: string) => void;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <SidebarSection title="Your session">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-32 rounded" />
              <Skeleton className="h-2.5 w-8 rounded" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
          <Skeleton className="h-3 w-48 rounded" />
        </div>
      </SidebarSection>
    );
  }

  const pct = totalCount > 0 ? Math.round((reviewedCount / totalCount) * 100) : 0;

  return (
    <SidebarSection title="Your session">
      <div className="flex flex-col gap-3">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs">
              <span className="font-medium tabular-nums">{reviewedCount}</span>
              <span className="text-muted-foreground">
                {" "}of {totalCount} reviewed
              </span>
            </span>
            <span className="text-muted-foreground text-[10px] tabular-nums">
              {pct}%
            </span>
          </div>
          <div className="bg-border mt-1.5 h-1.5 w-full overflow-hidden rounded-full">
            <div className="bg-foreground h-full" style={{ width: `${pct}%` }} />
          </div>
          {filteredUnreviewed > 0 && (
            <p className="text-muted-foreground mt-1 text-[10px]">
              {filteredUnreviewed} match your filters
            </p>
          )}
        </div>

        {/* Activity feed */}
        {activity.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Start scouting to see your activity here.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {activity.map((item, i) => {
              const Icon = ACTIVITY_ICONS[item.type];
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => onActivityClick(item.rosterId)}
                    className="flex w-full items-start gap-2 text-left"
                  >
                    <Icon className="text-muted-foreground mt-0.5 size-3 shrink-0" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-xs">{item.dancerName}</span>
                      <span className="text-muted-foreground text-[10px]">
                        {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SidebarSection>
  );
}
