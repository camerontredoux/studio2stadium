import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ClipboardCopyIcon, TrophyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast-manager";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { DancerTable } from "@/features/org/components/dancer-table/dancer-table";
import { DancerCard } from "@/features/org/components/dancer-table/dancer-card";
import { DancerSheet } from "@/features/org/components/dancer-sheet";
import { useRankingsColumns } from "@/features/org/components/dancer-table/use-dancer-columns";
import type { RankedDancerRow } from "@/features/org/components/dancer-table/columns";
import { StatCell } from "@/features/org/components/dashboard-shared";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/coach/rankings",
)({
  component: Rankings,
});

function Rankings() {
  const { orgSlug } = useParams({
    from: "/_org/$orgSlug/_authenticated/coach/rankings",
  });
  const { data, isLoading } = useQuery(scoutingQueries.rankings(orgSlug));

  const columns = useRankingsColumns();

  const tableData: RankedDancerRow[] = (data ?? []).map((d) => ({
    ...d,
    rating: d.rating ?? null,
    note: d.note ?? null,
    isFavorited: d.isFavorited ?? false,
  }));

  const [sheetRosterId, setSheetRosterId] = useState<string | null>(null);

  const totalScouted = data?.length ?? 0;
  const ratedCount = (data ?? []).filter((d) => d.rating != null).length;
  const withNotes = (data ?? []).filter((d) => d.note).length;
  const favoritedCount = (data ?? []).filter((d) => d.isFavorited).length;

  const copyNotes = async () => {
    const text = (data ?? [])
      .filter((d) => d.note)
      .map(
        (d) =>
          `#${d.bibNumber ?? "—"} ${d.firstName} ${d.lastName}${d.rating != null ? ` (${d.rating}/5)` : ""}\n${d.note}`,
      )
      .join("\n\n");
    if (!text) {
      toastManager.add({ title: "No notes to copy yet.", type: "info" });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toastManager.add({
        title: "Notes copied to clipboard",
        type: "success",
      });
    } catch {
      toastManager.add({
        title: "Could not copy to clipboard",
        type: "error",
      });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-semibold tracking-tight 2xl:text-xl">
            My Rankings
          </h1>
          <span className="text-muted-foreground text-xs tabular-nums 2xl:text-sm">
            {totalScouted} {totalScouted === 1 ? "dancer" : "dancers"} scouted
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={copyNotes}>
          <ClipboardCopyIcon className="mr-1.5 size-3.5" />
          Copy Notes
        </Button>
      </header>

      <section
        aria-label="Rankings stats"
        className="border-border flex items-stretch border-y"
      >
        <StatCell label="Scouted" value={totalScouted} />
        <StatCell label="Rated" value={ratedCount} />
        <StatCell label="With Notes" value={withNotes} />
        <StatCell label="Favorited" value={favoritedCount} />
      </section>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <DancerTable<RankedDancerRow>
          data={tableData}
          columns={columns}
          isLoading={isLoading}
          sorting={[{ id: "rating", desc: true }]}
          emptyState={
            <div className="flex flex-col items-center gap-2 py-8">
              <TrophyIcon className="text-muted-foreground size-8" />
              <p className="text-muted-foreground text-sm">
                No ratings yet. Rate dancers from the search list to build your
                rankings.
              </p>
            </div>
          }
          onRowClick={(row) => setSheetRosterId(row.rosterId)}
          renderCard={(row) => (
            <DancerCard
              dancer={row}
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
