import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { ChevronDownIcon, Megaphone, SendIcon, SkipForwardIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTab } from "@/components/ui/tabs";
import { cn } from "@/components/utils/cn";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import {
  LivePulse,
  StatCell,
} from "@/features/org/components/dashboard-shared";
import { DancerSheet } from "@/features/org/components/dancer-sheet";
import {
  type TransmitStatus,
  useTransmitStatus,
  useTransmitSubscription,
} from "@/features/org/hooks/use-transmit";
import { $api } from "@/lib/api/client";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/admin/callbacks",
)({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(
      scoutingQueries.showcases(params.orgSlug),
    );
  },
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
  const { data: showcases } = useSuspenseQuery(
    scoutingQueries.showcases(orgSlug),
  );
  const qc = useQueryClient();
  const sseStatus = useTransmitStatus();
  const [sheetRosterId, setSheetRosterId] = useState<string | null>(null);

  useTransmitSubscription(`orgs/${orgSlug}/callbacks`, () => {
    qc.invalidateQueries({
      queryKey: scoutingQueries.adminCallbacks(orgSlug).queryKey,
    });
    qc.invalidateQueries({
      queryKey: scoutingQueries.showcases(orgSlug).queryKey,
    });
  });

  useTransmitSubscription(`orgs/${orgSlug}/showcases`, () => {
    qc.invalidateQueries({
      queryKey: scoutingQueries.adminCallbacks(orgSlug).queryKey,
    });
    qc.invalidateQueries({
      queryKey: scoutingQueries.showcases(orgSlug).queryKey,
    });
  });

  const showcase = data.showcase;
  const isPublished = showcase?.status === "published";
  const publishedShowcases = showcases.filter(
    (s: { status: string }) => s.status === "published",
  );

  const publishMutation = $api.useMutation(
    "post",
    "/orgs/{slug}/showcases/publish",
    {
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey: scoutingQueries.adminCallbacks(orgSlug).queryKey,
        });
        qc.invalidateQueries({
          queryKey: scoutingQueries.showcases(orgSlug).queryKey,
        });
      },
    },
  );

  const nextMutation = $api.useMutation(
    "post",
    "/orgs/{slug}/showcases/next",
    {
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey: scoutingQueries.adminCallbacks(orgSlug).queryKey,
        });
        qc.invalidateQueries({
          queryKey: scoutingQueries.showcases(orgSlug).queryKey,
        });
      },
    },
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight">Callbacks</h1>
          {showcase && (
            <Badge variant={isPublished ? "success" : "info"} size="lg">
              Showcase {showcase.number} (
              {isPublished ? "Published" : "Active"})
            </Badge>
          )}
          {!isPublished && (
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <LivePulse />
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isPublished && (
            <PublishDialog
              disabled={data.uniqueCallbacks === 0}
              loading={publishMutation.isPending}
              onConfirm={() =>
                publishMutation.mutate({
                  params: { path: { slug: orgSlug } },
                })
              }
            />
          )}
          {isPublished && (
            <StartNextDialog
              loading={nextMutation.isPending}
              onConfirm={() =>
                nextMutation.mutate({
                  params: { path: { slug: orgSlug } },
                })
              }
            />
          )}
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

      {/* Tabs */}
      <Tabs defaultValue="current" className="flex-1">
        {publishedShowcases.length > 0 && (
          <TabsList variant="underline" className="px-4 pt-4">
            <TabsTab value="current">Current</TabsTab>
            <TabsTab value="previous">Previous</TabsTab>
          </TabsList>
        )}

        <TabsContent value="current" className="flex-1">
          <CallbackBibGrid
            bibs={data.bibs}
            onSelectDancer={setSheetRosterId}
          />
        </TabsContent>

        {publishedShowcases.length > 0 && (
          <TabsContent value="previous" className="p-4">
            <div className="space-y-3">
              {publishedShowcases.map(
                (s: {
                  id: string;
                  number: number;
                  publishedAt: string | null;
                }) => (
                  <PreviousShowcaseCard
                    key={s.id}
                    showcase={s}
                    orgSlug={orgSlug}
                    onSelectDancer={setSheetRosterId}
                  />
                ),
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Footer */}
      {data.bibs.length > 0 && (
        <footer className="border-border text-muted-foreground flex items-center justify-between border-t px-4 py-3 text-xs">
          <span>
            {data.uniqueCallbacks} number
            {data.uniqueCallbacks === 1 ? "" : "s"} · no repeats
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

function CallbackBibGrid({
  bibs,
  onSelectDancer,
}: {
  bibs: {
    dancerRosterId: string;
    bibNumber: number | null;
    firstName: string;
    lastName: string;
    coachCount: number;
  }[];
  onSelectDancer: (rosterId: string) => void;
}) {
  if (bibs.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-24">
        <Megaphone className="size-8 opacity-40" />
        <p className="text-sm">No callbacks yet.</p>
        <p className="text-xs opacity-60">
          Bib numbers will appear here as coaches make selections.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2">
        {bibs.map((bib) => (
          <button
            type="button"
            key={bib.dancerRosterId}
            onClick={() => onSelectDancer(bib.dancerRosterId)}
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
        ))}
      </div>
    </div>
  );
}

function PreviousShowcaseCard({
  showcase,
  orgSlug,
  onSelectDancer,
}: {
  showcase: { id: string; number: number; publishedAt: string | null };
  orgSlug: string;
  onSelectDancer: (rosterId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const { data: bibs, isLoading } = useQuery({
    ...scoutingQueries.publishedCallbacks(orgSlug, showcase.id),
    enabled: expanded,
  });

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="hover:bg-accent flex w-full items-center justify-between rounded-lg p-4 text-left transition-colors"
      >
        <span className="text-sm font-semibold">
          Showcase {showcase.number}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            Published{" "}
            {showcase.publishedAt
              ? new Date(showcase.publishedAt).toLocaleDateString()
              : ""}
          </span>
          <ChevronDownIcon
            className={cn(
              "text-muted-foreground size-4 transition-transform",
              expanded && "rotate-180",
            )}
          />
        </div>
      </button>
      {expanded && (
        <div className="border-t">
          {isLoading ? (
            <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
              Loading...
            </div>
          ) : bibs && bibs.length > 0 ? (
            <CallbackBibGrid bibs={bibs} onSelectDancer={onSelectDancer} />
          ) : (
            <div className="text-muted-foreground py-8 text-center text-sm">
              No callbacks in this showcase.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PublishDialog({
  disabled,
  loading,
  onConfirm,
}: {
  disabled: boolean;
  loading: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button size="sm" disabled={disabled || loading}>
            <SendIcon className="size-3.5" />
            Publish Callbacks
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish Callbacks</DialogTitle>
          <DialogDescription>
            This will lock in the top 5 callbacks per coach (ranked by rating,
            then recency) and make them visible to dancers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? "Publishing..." : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StartNextDialog({
  loading,
  onConfirm,
}: {
  loading: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline" disabled={loading}>
            <SkipForwardIcon className="size-3.5" />
            Start Next Showcase
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Next Showcase</DialogTitle>
          <DialogDescription>
            This will archive the current showcase and start a fresh round.
            Coaches will have an empty callback list.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? "Starting..." : "Start Next Showcase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
