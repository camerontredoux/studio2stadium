import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRightIcon,
  ExpandIcon,
  HeartIcon,
  SearchIcon,
  StarIcon,
  TrophyIcon,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toastManager } from "@/components/ui/toast-manager";
import { adminQueries, type OrgEvent } from "@/features/org/api/admin-queries";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { orgQueries } from "@/features/org/api/queries";
import { useOrg } from "@/features/org/context/use-org";
import { client } from "@/lib/api/client";
import {
  AccentDot,
  DashboardHeader,
  formatDateRange,
  scheduleFileUrl,
  SidebarDetailsSection,
  SidebarPhaseSection,
  SidebarSection,
  StatCell,
} from "@/features/org/components/dashboard-shared";
import { useEventPhase } from "@/features/org/hooks/use-event-phase";
import type { EventPhaseInfo } from "@/features/org/hooks/use-event-phase";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/coach/event-info",
)({
  component: EventInfo,
});

function EventInfo() {
  const { orgSlug } = Route.useParams();
  const { isAdmin, myRoster } = useOrg();
  const { data: events } = useQuery(adminQueries.events(orgSlug));
  const activeEvent = events?.find((e) => e.isActive) ?? null;

  if (!activeEvent) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        No active event.
      </div>
    );
  }

  if (isAdmin && !myRoster) {
    return <AttendEventGate orgSlug={orgSlug} eventName={activeEvent.name} />;
  }

  return <CoachDashboard orgSlug={orgSlug} event={activeEvent} />;
}

function AttendEventGate({
  orgSlug,
  eventName,
}: {
  orgSlug: string;
  eventName: string;
}) {
  const queryClient = useQueryClient();
  const attendMutation = useMutation({
    mutationFn: async () => {
      const raw = client as unknown as {
        POST: (
          path: string,
          opts: { body: { type: "coach" | "dancer" } },
        ) => Promise<void>;
      };
      await raw.POST(`/orgs/${orgSlug}/events/attend`, {
        body: { type: "coach" },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(orgQueries.org(orgSlug));
    },
    onError: () => {
      toastManager.add({
        title: "Couldn't attend event",
        description: "Unable to register you on the active event right now.",
        type: "error",
      });
    },
  });

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="border-border bg-card flex max-w-md flex-col items-center gap-3 rounded-md border p-6 text-center">
        <h2 className="text-base font-semibold 2xl:text-lg">
          Attend {eventName}
        </h2>
        <p className="text-muted-foreground text-sm 2xl:text-base">
          You need to be registered on this event as a coach to scout dancers,
          save favorites, and rank.
        </p>
        <Button
          onClick={() => attendMutation.mutate()}
          disabled={attendMutation.isPending}
        >
          {attendMutation.isPending ? "Attending..." : "Attend event"}
        </Button>
      </div>
    </div>
  );
}

function CoachDashboard({
  orgSlug,
  event,
}: {
  orgSlug: string;
  event: OrgEvent;
}) {
  const { data: dancers } = useQuery(scoutingQueries.dancers(orgSlug));
  const { data: favorites } = useQuery(scoutingQueries.favorites(orgSlug));
  const { data: schools } = useQuery(scoutingQueries.schools(orgSlug));
  const { data: rankings } = useQuery(scoutingQueries.rankings(orgSlug));

  const phase = useEventPhase(event.startDate, event.endDate);
  const dateRange = formatDateRange(event.startDate, event.endDate);

  const dancerCount = dancers?.length ?? 0;
  const favCount = favorites?.length ?? 0;
  const schoolCount = schools?.length ?? 0;

  const recentFavorites = (rankings ?? [])
    .filter((d) => d.isFavorited && d.favoritedAt)
    .sort(
      (a, b) =>
        new Date(b.favoritedAt!).getTime() -
        new Date(a.favoritedAt!).getTime(),
    )
    .slice(0, 4);

  const topRanked = (rankings ?? [])
    .filter((d) => d.rating != null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto xl:flex-row xl:overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardHeader
          name={event.name}
          phase={phase}
          dateRange={dateRange}
        />

        <section
          aria-label="Event stats"
          className="border-border flex shrink-0 items-stretch border-y"
        >
          <StatCell label="Dancers" value={dancerCount} accent="blue" />
          <StatCell label="Schools" value={schoolCount || "—"} accent="purple" />
          <StatCell label="Your Favorites" value={favCount} accent="rose" />
        </section>

        <section
          aria-label="Scouting tools"
          className={`grid min-h-0 flex-1 grid-cols-1 content-start gap-3 p-4 lg:grid-cols-2 ${
            event.schedulePdfUrl ? "lg:grid-rows-[auto_1fr]" : ""
          }`}
        >
          <QuickNavPanel
            orgSlug={orgSlug}
            dancerCount={dancerCount}
            favCount={favCount}
          />
          <TopRankedPanel orgSlug={orgSlug} ranked={topRanked} />
          {event.schedulePdfUrl && (
            <div className="flex h-full min-h-0 flex-col lg:col-span-2">
              <SchedulePreviewPanel
                orgSlug={orgSlug}
                eventId={event.id}
                scheduleKey={event.schedulePdfUrl}
              />
            </div>
          )}
        </section>
      </div>

      <CoachSidebarPanel
        orgSlug={orgSlug}
        event={event}
        phase={phase}
        recentFavorites={recentFavorites}
      />
    </div>
  );
}

function QuickNavPanel({
  orgSlug,
  dancerCount,
  favCount,
}: {
  orgSlug: string;
  dancerCount: number;
  favCount: number;
}) {
  const navItems = [
    {
      icon: SearchIcon,
      label: "Search Dancers",
      to: "/$orgSlug/coach/dancers",
      description: `${dancerCount} dancers registered`,
      iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    {
      icon: HeartIcon,
      label: "My Favorites",
      to: "/$orgSlug/coach/dancers",
      description: `${favCount} dancers saved`,
      iconClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    },
    {
      icon: TrophyIcon,
      label: "My Rankings",
      to: "/$orgSlug/coach/dancers",
      description: "Review your ranked dancers",
      iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
  ];

  return (
    <div className="border-border flex max-h-72 min-h-0 w-full flex-col overflow-y-auto rounded-md border">
      <div className="border-border bg-muted/40 flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex min-w-0 flex-col">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase 2xl:text-xs">
            <AccentDot accent="blue" />
            Scouting tools
          </span>
          <span className="text-muted-foreground text-[11px] 2xl:text-xs">
            Jump to key sections
          </span>
        </div>
      </div>
      <ul className="divide-border divide-y">
        {navItems.map((item) => (
          <li key={item.label}>
            <Link
              to={item.to}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              params={{ orgSlug } as any}
              className="hover:bg-muted/40 group flex items-center gap-3 px-3 py-2.5 transition-colors"
            >
              <span className={`flex size-7 items-center justify-center rounded-md border ${item.iconClass}`}>
                <item.icon className="size-3.5" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-xs font-medium 2xl:text-sm">
                  {item.label}
                </span>
                <span className="text-muted-foreground text-[11px] 2xl:text-xs">
                  {item.description}
                </span>
              </div>
              <ArrowRightIcon className="text-muted-foreground size-3 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

type RankedDancer = {
  rosterId: string;
  firstName: string;
  lastName: string;
  bibNumber: number | null;
  studio: string | null;
  rating: number | null;
  profilePhotoUrl: string | null;
};

function TopRankedPanel({
  orgSlug,
  ranked,
}: {
  orgSlug: string;
  ranked: RankedDancer[];
}) {
  return (
    <div className="border-border flex max-h-72 min-h-0 w-full flex-col overflow-hidden rounded-md border">
      <div className="border-border bg-muted/40 flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex min-w-0 flex-col">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase 2xl:text-xs">
            <AccentDot accent="amber" />
            Top ranked
          </span>
          <span className="text-muted-foreground text-[11px] 2xl:text-xs">
            Your highest-rated dancers
          </span>
        </div>
        {ranked.length > 0 && (
          <Link
            to="/$orgSlug/coach/dancers"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            params={{ orgSlug } as any}
            className="text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors 2xl:text-xs"
          >
            View all
          </Link>
        )}
      </div>
      {ranked.length === 0 ? (
        <div className="text-muted-foreground px-3 py-4 text-center text-xs">
          No rated dancers yet. Start scouting to build your rankings.
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-border border-b">
                <th className="text-muted-foreground px-3 py-1.5 text-left text-[10px] font-medium tracking-wide uppercase 2xl:text-xs">
                  Dancer
                </th>
                <th className="text-muted-foreground w-16 px-3 py-1.5 text-right text-[10px] font-medium tracking-wide uppercase 2xl:text-xs">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((dancer) => (
                <tr
                  key={dancer.rosterId}
                  className="border-border hover:bg-muted/30 border-b transition-colors last:border-b-0"
                >
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      {dancer.profilePhotoUrl ? (
                        <img
                          src={dancer.profilePhotoUrl}
                          alt=""
                          className="size-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="bg-muted flex size-6 items-center justify-center rounded-full text-[10px] font-medium">
                          {dancer.firstName.charAt(0)}
                          {dancer.lastName.charAt(0)}
                        </div>
                      )}
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-xs font-medium 2xl:text-sm">
                          {dancer.firstName} {dancer.lastName}
                        </span>
                        {dancer.bibNumber && (
                          <span className="text-muted-foreground text-[10px] tabular-nums 2xl:text-xs">
                            #{dancer.bibNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <StarIcon className="text-warning size-3 fill-current" />
                      <span className="text-xs font-medium tabular-nums 2xl:text-sm">
                        {dancer.rating}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type FavoriteDancer = {
  rosterId: string;
  firstName: string;
  lastName: string;
  bibNumber: number | null;
  profilePhotoUrl: string | null;
  studio: string | null;
  favoritedAt: string | null;
};

function SchedulePreviewPanel({
  orgSlug,
  eventId,
  scheduleKey,
}: {
  orgSlug: string;
  eventId: string;
  scheduleKey: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const fileUrl = scheduleFileUrl(orgSlug, eventId);
  const isPdf = scheduleKey.endsWith(".pdf");

  return (
    <>
      <div className="border-border flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-md border">
        <div className="border-border bg-muted/40 flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2">
          <div className="flex min-w-0 flex-col">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase 2xl:text-xs">
              <AccentDot accent="green" />
              Event Schedule
            </span>
            <span className="text-muted-foreground text-[11px] 2xl:text-xs">
              Uploaded by organizer
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-5"
            onClick={() => setExpanded(true)}
            aria-label="Expand schedule"
          >
            <ExpandIcon className="size-3" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-clip">
          {isPdf ? (
            <iframe
              src={fileUrl}
              className="h-full w-full"
              title="Event schedule"
            />
          ) : (
            <img
              src={fileUrl}
              alt="Event schedule"
              className="h-full w-full object-contain"
            />
          )}
        </div>
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-5xl" bottomStickOnMobile={false}>
          <DialogHeader>
            <DialogTitle>Event Schedule</DialogTitle>
          </DialogHeader>
          <div className="h-[80vh] w-full px-6 pb-6">
            {isPdf ? (
              <iframe
                src={fileUrl}
                className="h-full w-full rounded-md border"
                title="Event schedule"
              />
            ) : (
              <img
                src={fileUrl}
                alt="Event schedule"
                className="h-full w-full rounded-md object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CoachSidebarPanel({
  orgSlug,
  event,
  phase,
  recentFavorites,
}: {
  orgSlug: string;
  event: OrgEvent;
  phase: EventPhaseInfo;
  recentFavorites: FavoriteDancer[];
}) {
  return (
    <aside className="border-border flex w-full shrink-0 flex-col border-t xl:w-[320px] xl:overflow-x-hidden xl:overflow-y-auto xl:border-t-0 xl:border-l">
      <SidebarPhaseSection phase={phase} />
      <SidebarDetailsSection orgSlug={orgSlug} event={event} />
      <SidebarSection title="Recent favorites" accent="rose">
        {recentFavorites.length === 0 ? (
          <p className="text-muted-foreground text-xs 2xl:text-sm">
            No favorites yet.
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {recentFavorites.map((dancer) => (
                <li
                  key={dancer.rosterId}
                  className="flex items-start gap-2 text-xs 2xl:text-sm"
                >
                  <HeartIcon className="text-rose-500 mt-0.5 size-3 shrink-0" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span>
                      <span className="font-medium">
                        {dancer.firstName} {dancer.lastName}
                      </span>
                      {dancer.bibNumber && (
                        <span className="text-muted-foreground">
                          {" "}
                          #{dancer.bibNumber}
                        </span>
                      )}
                    </span>
                    {dancer.favoritedAt && (
                      <span className="text-muted-foreground text-[10px] 2xl:text-xs">
                        {formatDistanceToNow(new Date(dancer.favoritedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <Link
              to="/$orgSlug/coach/dancers"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              params={{ orgSlug } as any}
              className="text-foreground hover:text-brand mt-3 inline-flex items-center gap-1 text-[11px] font-medium 2xl:text-xs"
            >
              View all favorites
              <ArrowRightIcon className="size-3" />
            </Link>
          </>
        )}
      </SidebarSection>
    </aside>
  );
}
