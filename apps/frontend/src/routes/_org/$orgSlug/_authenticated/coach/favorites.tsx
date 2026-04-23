import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { DancerTable } from "@/features/org/components/dancer-table/dancer-table";
import { DancerCard } from "@/features/org/components/dancer-table/dancer-card";
import { DancerSheet } from "@/features/org/components/dancer-sheet";
import { useFavoritesColumns } from "@/features/org/components/dancer-table/use-dancer-columns";
import type { FavoriteDancerRow } from "@/features/org/components/dancer-table/columns";
import { HeartIcon } from "lucide-react";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/coach/favorites",
)({
  component: Favorites,
});

function Favorites() {
  const { orgSlug } = useParams({
    from: "/_org/$orgSlug/_authenticated/coach/favorites",
  });
  const { data } = useSuspenseQuery(scoutingQueries.favorites(orgSlug));

  const columns = useFavoritesColumns();

  const tableData: FavoriteDancerRow[] = (data ?? []).map((d) => ({
    ...d,
    rating: null,
    hasNotes: false,
  }));

  const [sheetRosterId, setSheetRosterId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">My Favorites</h1>
        <span className="text-muted-foreground text-sm">
          {data?.length ?? 0}{" "}
          {(data?.length ?? 0) === 1 ? "dancer" : "dancers"}
        </span>
      </div>

      <DancerTable<FavoriteDancerRow>
        data={tableData}
        columns={columns}
        isLoading={false}
        sorting={[{ id: "rating", desc: true }]}
        emptyState={
          <div className="flex flex-col items-center gap-2 py-8">
            <HeartIcon className="text-muted-foreground size-8" />
            <p className="text-muted-foreground text-sm">
              No favorites yet. Tap the heart on any dancer to add them here.
            </p>
            <Link
              to="/$orgSlug/coach/dancers"
              params={{ orgSlug }}
              className="text-primary text-sm hover:underline"
            >
              Search Dancers
            </Link>
          </div>
        }
        onRowClick={(row) => setSheetRosterId(row.rosterId)}
        renderCard={(row) => (
          <DancerCard
            dancer={{ ...row, isFavorited: true }}
            onClick={() => setSheetRosterId(row.rosterId)}
          />
        )}
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
