import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRightIcon,
  HeartIcon,
  SearchIcon,
  StarIcon,
  TrophyIcon,
} from "lucide-react";

import { adminQueries, type OrgEvent } from "@/features/org/api/admin-queries";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import {
  DashboardHeader,
  formatDateRange,
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
  const { data: events } = useQuery(adminQueries.events(orgSlug));
  const activeEvent = events?.find((e) => e.isActive) ?? null;

  if (!activeEvent) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        No active event.
      </div>
    );
  }

  return <CoachDashboard orgSlug={orgSlug} event={activeEvent} />;
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
      <div className="flex min-w-0 flex-col xl:min-h-0 xl:flex-1 xl:overflow-x-hidden xl:overflow-y-auto">
        <DashboardHeader
          name={event.name}
          phase={phase}
          dateRange={dateRange}
        />

        <section
          aria-label="Event stats"
          className="border-border flex items-stretch border-y"
        >
          <StatCell label="Dancers" value={dancerCount} />
          <StatCell label="Schools" value={schoolCount || "—"} />
          <StatCell label="Your Favorites" value={favCount} />
        </section>

        <section
          aria-label="Scouting tools"
          className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2"
        >
          <QuickNavPanel
            orgSlug={orgSlug}
            dancerCount={dancerCount}
            favCount={favCount}
          />
          <TopRankedPanel orgSlug={orgSlug} ranked={topRanked} />
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
    },
    {
      icon: HeartIcon,
      label: "My Favorites",
      to: "/$orgSlug/coach/favorites",
      description: `${favCount} dancers saved`,
    },
    {
      icon: TrophyIcon,
      label: "My Rankings",
      to: "/$orgSlug/coach/rankings",
      description: "Review your ranked dancers",
    },
  ];

  return (
    <div className="border-border flex h-full min-h-0 w-full flex-col rounded-md border">
      <div className="border-border bg-muted/40 flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-[11px] font-semibold tracking-wider uppercase 2xl:text-xs">
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
              <span className="border-border bg-background flex size-7 items-center justify-center rounded-md border">
                <item.icon className="text-muted-foreground size-3.5" />
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
    <div className="border-border flex h-full min-h-0 w-full flex-col rounded-md border">
      <div className="border-border bg-muted/40 flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-[11px] font-semibold tracking-wider uppercase 2xl:text-xs">
            Top ranked
          </span>
          <span className="text-muted-foreground text-[11px] 2xl:text-xs">
            Your highest-rated dancers
          </span>
        </div>
        {ranked.length > 0 && (
          <Link
            to="/$orgSlug/coach/rankings"
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
      <SidebarSection title="Recent favorites">
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
                  <HeartIcon className="text-muted-foreground mt-0.5 size-3 shrink-0" />
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
              to="/$orgSlug/coach/favorites"
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
