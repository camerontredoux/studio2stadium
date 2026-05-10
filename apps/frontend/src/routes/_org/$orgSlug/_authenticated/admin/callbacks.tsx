import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";

import { cn } from "@/components/utils/cn";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { LivePulse, StatCell } from "@/features/org/components/dashboard-shared";
import { useTransmitSubscription } from "@/features/org/hooks/use-transmit";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/admin/callbacks",
)({
  component: AdminCallbacksPage,
});

function AdminCallbacksPage() {
  const { orgSlug } = useParams({
    from: "/_org/$orgSlug/_authenticated/admin/callbacks",
  });
  const { data } = useSuspenseQuery(scoutingQueries.adminCallbacks(orgSlug));
  const qc = useQueryClient();

  useTransmitSubscription(`orgs/${orgSlug}/callbacks`, () => {
    qc.invalidateQueries({
      queryKey: scoutingQueries.adminCallbacks(orgSlug).queryKey,
    });
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight">Callbacks</h1>
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <LivePulse />
            Live — updating as coaches select
          </span>
        </div>
      </header>

      {/* Stat cards */}
      <section
        aria-label="Callback stats"
        className="border-border flex items-stretch border-y"
      >
        <StatCell label="Total Schools" value={data.totalSchools} />
        <StatCell label="Total Dancers" value={data.totalDancers} />
        <StatCell
          label="Callbacks Selected"
          value={data.uniqueCallbacks}
          accent="amber"
        />
      </section>

      {/* Bib grid */}
      <div className="flex-1 p-4">
        {data.bibs.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-24">
            <Megaphone className="size-8 opacity-40" />
            <p className="text-sm">No callbacks yet.</p>
            <p className="text-xs opacity-60">
              Bib numbers will appear here as coaches make selections.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.bibs.map(
              (bib: {
                dancerRosterId: string;
                bibNumber: number | null;
                firstName: string;
                lastName: string;
                coachCount: number;
              }) => (
                <div
                  key={bib.dancerRosterId}
                  className={cn(
                    "bg-foreground text-background flex min-w-[72px] flex-col items-center justify-center rounded-xl px-3 py-2.5",
                  )}
                >
                  <span className="text-xl font-bold tabular-nums leading-none">
                    {bib.bibNumber != null
                      ? String(bib.bibNumber).padStart(2, "0")
                      : "—"}
                  </span>
                  <span className="mt-1 max-w-[80px] truncate text-[10px] opacity-70">
                    {bib.firstName} {bib.lastName?.[0]}.
                  </span>
                  {Number(bib.coachCount) > 1 && (
                    <span className="mt-0.5 text-[10px] opacity-50">
                      {bib.coachCount} coaches
                    </span>
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {data.bibs.length > 0 && (
        <footer className="border-border text-muted-foreground flex items-center justify-between border-t px-4 py-3 text-xs">
          <span>
            {data.uniqueCallbacks} number{data.uniqueCallbacks === 1 ? "" : "s"}{" "}
            · no repeats
          </span>
          <span>
            Sharpen Up staff decides how to split these into groups based on
            total count.
          </span>
        </footer>
      )}
    </div>
  );
}
