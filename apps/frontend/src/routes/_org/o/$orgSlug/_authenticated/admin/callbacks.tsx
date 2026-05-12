import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { useState } from "react";

import { cn } from "@/components/utils/cn";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { LivePulse, StatCell } from "@/features/org/components/dashboard-shared";
import { DancerSheet } from "@/features/org/components/dancer-sheet";
import {
  type TransmitStatus,
  useTransmitStatus,
  useTransmitSubscription,
} from "@/features/org/hooks/use-transmit";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/admin/callbacks",
)({
  component: AdminCallbacksPage,
});

const SSE_STATUS_CONFIG: Record<
  TransmitStatus,
  { border: string; text: string; dot: string; label: string }
> = {
  connected: {
    border: "border-success/60",
    text: "text-success",
    dot: "bg-emerald-500",
    label: "Connected",
  },
  connecting: {
    border: "border-warning/60",
    text: "text-warning",
    dot: "bg-amber-500",
    label: "Connecting",
  },
  reconnecting: {
    border: "border-warning/60",
    text: "text-warning",
    dot: "bg-amber-500",
    label: "Reconnecting",
  },
  disconnected: {
    border: "border-destructive/60",
    text: "text-destructive",
    dot: "bg-red-500",
    label: "Disconnected",
  },
};

function AdminCallbacksPage() {
  const { orgSlug } = useParams({
    from: "/_org/o/$orgSlug/_authenticated/admin/callbacks",
  });
  const { data } = useSuspenseQuery(scoutingQueries.adminCallbacks(orgSlug));
  const qc = useQueryClient();
  const sseStatus = useTransmitStatus();
  const [sheetRosterId, setSheetRosterId] = useState<string | null>(null);

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
          <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2">
            {data.bibs.map(
              (bib: {
                dancerRosterId: string;
                bibNumber: number | null;
                firstName: string;
                lastName: string;
                coachCount: number;
              }) => (
                <button
                  type="button"
                  key={bib.dancerRosterId}
                  onClick={() => setSheetRosterId(bib.dancerRosterId)}
                  className="bg-muted hover:bg-accent flex cursor-pointer flex-col items-center justify-center rounded-lg px-3 py-2.5 transition-colors"
                >
                  <span className="text-xl font-bold tabular-nums leading-none">
                    {bib.bibNumber != null
                      ? String(bib.bibNumber).padStart(2, "0")
                      : "—"}
                  </span>
                  <span className="text-muted-foreground mt-1 max-w-full truncate text-[10px]">
                    {bib.firstName} {bib.lastName?.[0]}.
                  </span>
                  {Number(bib.coachCount) > 1 && (
                    <span className="text-muted-foreground mt-0.5 text-[10px] opacity-60">
                      {bib.coachCount} coaches
                    </span>
                  )}
                </button>
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
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase",
              SSE_STATUS_CONFIG[sseStatus].border,
              SSE_STATUS_CONFIG[sseStatus].text,
            )}
          >
            <span className="relative flex size-1.5">
              <span
                className={`absolute size-full animate-ping rounded-full ${SSE_STATUS_CONFIG[sseStatus].dot}`}
              />
              <span
                className={`relative size-1.5 rounded-full ${SSE_STATUS_CONFIG[sseStatus].dot}`}
              />
            </span>
            {SSE_STATUS_CONFIG[sseStatus].label}
          </span>
        </footer>
      )}

      <DancerSheet
        rosterId={sheetRosterId}
        open={sheetRosterId !== null}
        onOpenChange={(open) => {
          if (!open) setSheetRosterId(null);
        }}
        readOnly
      />
    </div>
  );
}
