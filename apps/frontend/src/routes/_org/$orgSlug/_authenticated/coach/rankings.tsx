import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast-manager";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { DancerTable } from "@/features/org/components/dancer-table/dancer-table";
import { DancerCard } from "@/features/org/components/dancer-table/dancer-card";
import { DancerSheet } from "@/features/org/components/dancer-sheet";
import { useRankingsColumns } from "@/features/org/components/dancer-table/use-dancer-columns";
import type { RankedDancerRow } from "@/features/org/components/dancer-table/columns";
import { ClipboardCopyIcon, TrophyIcon } from "lucide-react";

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
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold">My Rankings</h1>
          <p className="text-muted-foreground text-sm">
            {data?.length ?? 0}{" "}
            {(data?.length ?? 0) === 1 ? "dancer" : "dancers"} scouted
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={copyNotes}>
          <ClipboardCopyIcon className="mr-1.5 size-3.5" />
          Copy Notes
        </Button>
      </div>

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
