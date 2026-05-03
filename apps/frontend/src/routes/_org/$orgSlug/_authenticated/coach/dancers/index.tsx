import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useDeferredValue, useState } from "react";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import {
  useAddFavorite,
  useRemoveFavorite,
} from "@/features/org/api/scouting-mutations";
import { useOrg } from "@/features/org/context/use-org";
import { DancerTable } from "@/features/org/components/dancer-table/dancer-table";
import { DancerCard } from "@/features/org/components/dancer-table/dancer-card";
import { DancerSheet } from "@/features/org/components/dancer-sheet";
import { DancerSearchForm } from "@/features/org/components/dancer-search-form";
import { useSearchColumns } from "@/features/org/components/dancer-table/use-dancer-columns";
import type { SearchDancerRow } from "@/features/org/components/dancer-table/columns";
import { StatCell } from "@/features/org/components/dashboard-shared";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/coach/dancers/",
)({
  component: DancerSearch,
});

function DancerSearch() {
  const { orgSlug } = useParams({
    from: "/_org/$orgSlug/_authenticated/coach/dancers/",
  });
  const { org } = useOrg();

  const [search, setSearch] = useState("");
  const [interested, setInterested] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const { data: dancers, isLoading } = useQuery(
    scoutingQueries.dancers(orgSlug, { interested: interested || undefined }),
  );
  const { data: favorites } = useQuery(scoutingQueries.favorites(orgSlug));
  const { data: schools } = useQuery(scoutingQueries.schools(orgSlug));

  const favoritedIds = new Set(
    Array.isArray(favorites) ? favorites.map((f) => f.rosterId) : [],
  );

  const addFav = useAddFavorite(orgSlug);
  const removeFav = useRemoveFavorite(orgSlug);

  const handleFavoriteToggle = useCallback(
    (rosterId: string, current: boolean) => {
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
    },
    [orgSlug, addFav, removeFav],
  );

  const columns = useSearchColumns(handleFavoriteToggle);

  const tableData: SearchDancerRow[] = (dancers ?? []).map((d) => ({
    ...d,
    isFavorited: favoritedIds.has(d.rosterId),
    hasNotes: false,
    interestedInMySchool: d.interestedInMySchool ?? false,
  }));

  const [sheetRosterId, setSheetRosterId] = useState<string | null>(null);

  const dancerCount = dancers?.length ?? 0;
  const schoolCount = schools?.length ?? 0;
  const favCount = favorites?.length ?? 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
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

      <section
        aria-label="Dancer stats"
        className="border-border flex items-stretch border-y"
      >
        <StatCell label="Total" value={dancerCount} />
        <StatCell label="Schools" value={schoolCount || "—"} />
        <StatCell label="Favorited" value={favCount} />
      </section>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <DancerSearchForm
          schoolName={org.name}
          onSearchChange={setSearch}
          onInterestedChange={setInterested}
        />

        <DancerTable<SearchDancerRow>
          data={tableData}
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
          onRowClick={(row) => setSheetRosterId(row.rosterId)}
          renderCard={(row) => (
            <DancerCard
              dancer={row}
              onClick={() => setSheetRosterId(row.rosterId)}
            />
          )}
          sorting={[{ id: "bibNumber", desc: false }]}
        />
      </div>

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
