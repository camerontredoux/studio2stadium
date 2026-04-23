import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useCallback, useState } from "react";
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
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [interested, setInterested] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const { data: dancers, isLoading } = useQuery(
    scoutingQueries.dancers(orgSlug, { interested: interested || undefined }),
  );
  const { data: favorites } = useQuery(
    scoutingQueries.favorites(orgSlug),
  );

  const favoritedIds = new Set(
    Array.isArray(favorites) ? favorites.map((f) => f.rosterId) : [],
  );

  const addFav = useAddFavorite(orgSlug);
  const removeFav = useRemoveFavorite(orgSlug);

  const handleFavoriteToggle = useCallback(
    async (rosterId: string, current: boolean) => {
      if (current) {
        await removeFav.mutateAsync({
          params: { path: { slug: orgSlug, dancerRosterId: rosterId } },
        });
      } else {
        await addFav.mutateAsync({
          params: { path: { slug: orgSlug } },
          body: { dancerRosterId: rosterId },
        });
      }
      qc.invalidateQueries({
        queryKey: scoutingQueries.favorites(orgSlug).queryKey,
      });
      qc.invalidateQueries({
        queryKey: scoutingQueries.dancers(orgSlug).queryKey,
      });
    },
    [orgSlug, addFav, removeFav, qc],
  );

  const columns = useSearchColumns(handleFavoriteToggle);

  const tableData: SearchDancerRow[] = (dancers ?? []).map((d) => ({
    ...d,
    isFavorited: favoritedIds.has(d.rosterId),
    hasNotes: false,
    interestedInMySchool: d.interestedInMySchool ?? false,
  }));

  const [sheetRosterId, setSheetRosterId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
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
