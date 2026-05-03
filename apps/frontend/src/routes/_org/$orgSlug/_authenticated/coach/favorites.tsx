import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { HeartIcon } from "lucide-react";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { DancerTable } from "@/features/org/components/dancer-table/dancer-table";
import { DancerCard } from "@/features/org/components/dancer-table/dancer-card";
import { DancerSheet } from "@/features/org/components/dancer-sheet";
import { useFavoritesColumns } from "@/features/org/components/dancer-table/use-dancer-columns";
import type { FavoriteDancerRow } from "@/features/org/components/dancer-table/columns";
import { StatCell } from "@/features/org/components/dashboard-shared";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/coach/favorites",
)({
  component: Favorites,
});

function Favorites() {
  const { orgSlug } = useParams({
    from: "/_org/$orgSlug/_authenticated/coach/favorites",
  });
  const { data, isLoading } = useQuery(scoutingQueries.favorites(orgSlug));

  const columns = useFavoritesColumns();

  const tableData: FavoriteDancerRow[] = (data ?? []).map((d) => ({
    ...d,
    rating: null,
    hasNotes: false,
  }));

  const [sheetRosterId, setSheetRosterId] = useState<string | null>(null);

  const totalSaved = data?.length ?? 0;
  const studios = new Set(
    (data ?? []).map((d) => d.studio).filter(Boolean),
  ).size;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-semibold tracking-tight 2xl:text-xl">
            My Favorites
          </h1>
          <span className="text-muted-foreground text-xs tabular-nums 2xl:text-sm">
            {totalSaved} {totalSaved === 1 ? "dancer" : "dancers"} saved
          </span>
        </div>
      </header>

      <section
        aria-label="Favorites stats"
        className="border-border flex items-stretch border-y"
      >
        <StatCell label="Saved" value={totalSaved} />
        <StatCell label="Studios" value={studios || "—"} />
      </section>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <DancerTable<FavoriteDancerRow>
          data={tableData}
          columns={columns}
          isLoading={isLoading}
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
