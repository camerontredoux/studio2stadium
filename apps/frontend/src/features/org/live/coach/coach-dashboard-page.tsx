import { ArrowRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { Panel } from "@/components/event/panel";
import { ShellHeader, WidgetBoard } from "@/components/event/shell";
import { toastManager } from "@/components/ui/toast-manager";
import type { OrgEvent } from "@/features/org/api/admin-queries";
import { orgQueries } from "@/features/org/api/queries";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import { EventDashboardHeader } from "@/features/org/live/shared/event-header";
import {
  EventDetailsBar,
  EventRail,
} from "@/features/org/live/shared/event-rail";
import { ScheduleWidget } from "@/features/org/live/shared/schedule-widget";
import { ShellPage } from "@/features/org/live/shared/shell-slots";
import { useActiveOrgEvent } from "@/features/org/live/shared/use-active-org-event";
import { client } from "@/lib/api/client";

import { useCoachScouting } from "./coach-scouting";
import { CallbacksWidget, FavoritesWidget } from "./dancer-list-widget";
import { TopRankedWidget } from "./top-ranked-widget";

/**
 * The coach dashboard. Before the coach's event (or while her Roster Entry is
 * inactive) it says scouting unlocks then; an admin previewing the coach view
 * without a coach Roster Entry on the active event gets the "Attend" gate;
 * otherwise the board: Schedule, Top ranked, Callbacks.
 */
export function CoachDashboardPage() {
  const { isAdmin } = useOrg();
  const { event, activeEvent, roster, isLoading } = useActiveOrgEvent();

  if (isLoading) {
    return <ShellPage header={<ShellHeader title="Dashboard" />} />;
  }

  if (!event) {
    return (
      <ShellPage header={<ShellHeader title="Dashboard" />}>
        <Panel className="text-fg-3 type-body items-center justify-center p-(--space-24)">
          No active event.
        </Panel>
      </ShellPage>
    );
  }

  if (isAdmin && !roster && activeEvent) {
    return <AttendEventGate event={activeEvent} />;
  }

  if (!isAdmin && roster && (!roster.isActive || !roster.hasStarted)) {
    return <PreEventDashboard event={event} />;
  }

  return <CoachBoard event={event} />;
}

function DashboardFrame({
  event,
  children,
}: {
  event: OrgEvent;
  children: ReactNode;
}) {
  return (
    <ShellPage
      header={<EventDashboardHeader event={event} />}
      rail={<EventRail event={event} />}
    >
      <EventDetailsBar event={event} />
      {children}
    </ShellPage>
  );
}

function BrowseDancersButton({
  variant,
  children,
}: {
  variant?: "primary" | "secondary";
  children: ReactNode;
}) {
  const { org } = useOrg();
  return (
    <Button
      variant={variant}
      render={
        <Link to="/o/$orgSlug/coach/dancers" params={{ orgSlug: org.slug }} />
      }
    >
      {children}
    </Button>
  );
}

function PreEventDashboard({ event }: { event: OrgEvent }) {
  return (
    <DashboardFrame event={event}>
      <Panel className="flex flex-col items-start gap-(--space-12) p-(--space-16)">
        <div className="flex flex-col gap-(--space-4)">
          <h2 className="text-fg m-0 text-[15px] font-semibold">
            Scouting opens at {event.name}
          </h2>
          <p className="text-fg-2 m-0 max-w-[560px] text-[13px] leading-[1.5]">
            Ratings, favorites, notes and callbacks unlock during your event.
            Until then you can browse dancers from every event.
          </p>
        </div>
        <BrowseDancersButton variant="primary">
          <Icon icon={MagnifyingGlassIcon} />
          Browse all dancers
        </BrowseDancersButton>
      </Panel>
    </DashboardFrame>
  );
}

function AttendEventGate({ event }: { event: OrgEvent }) {
  const { org } = useOrg();
  const queryClient = useQueryClient();
  const attend = useMutation({
    mutationFn: async () => {
      const { error } = await client.POST("/orgs/{slug}/events/view-as", {
        params: { path: { slug: org.slug } },
        body: { type: "coach" },
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(orgQueries.org(org.slug));
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
    <DashboardFrame event={event}>
      <Panel className="flex flex-col items-start gap-(--space-12) p-(--space-16)">
        <div className="flex flex-col gap-(--space-4)">
          <h2 className="text-fg m-0 text-[15px] font-semibold">
            Attend {event.name}
          </h2>
          <p className="text-fg-2 m-0 max-w-[560px] text-[13px] leading-[1.5]">
            You need to be registered on this event as a coach to scout dancers,
            save favorites and rank.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => attend.mutate()}
          disabled={attend.isPending}
        >
          {attend.isPending ? "Attending…" : "Attend event"}
          {!attend.isPending && <Icon icon={ArrowRightIcon} />}
        </Button>
      </Panel>
    </DashboardFrame>
  );
}

function CoachBoard({ event }: { event: OrgEvent }) {
  const scouting = useCoachScouting();
  const { slug, callbacksEnabled } = scouting;

  // Each widget asks for its own slice instead of the whole roster: the
  // ranked dancers a page at a time, and favorites only when they're shown.
  const ranked = useInfiniteQuery(
    scoutingQueries.dancerPages(slug, {
      eventId: event.id,
      filter: "rated",
      sortBy: "rank",
    }),
  );
  const favorites = useQuery({
    ...scoutingQueries.dancers(slug, {
      eventId: event.id,
      filter: "favorites",
      limit: 200,
    }),
    enabled: !callbacksEnabled,
  });
  const { data: callbacks = [] } = useQuery({
    ...scoutingQueries.callbacks(slug),
    enabled: callbacksEnabled,
  });
  const rankedPages = ranked.data?.pages;

  const order = ["schedule", "top", callbacksEnabled ? "cb" : "fav"];

  return (
    <DashboardFrame event={event}>
      <WidgetBoard order={order}>
        <ScheduleWidget event={event} mode="viewer" />
        <TopRankedWidget
          ranked={rankedPages?.flatMap((page) => page.data) ?? []}
          rosterSize={rankedPages?.[0]?.counts.all ?? 0}
          ratedCount={rankedPages?.[0]?.total ?? 0}
          hasMore={ranked.hasNextPage}
          loadingMore={ranked.isFetchingNextPage}
          onLoadMore={() => void ranked.fetchNextPage()}
          scouting={scouting}
        />
        {callbacksEnabled ? (
          <CallbacksWidget
            callbacks={callbacks}
            eventId={event.id}
            scouting={scouting}
          />
        ) : (
          <FavoritesWidget
            favorites={favorites.data?.data ?? []}
            scouting={scouting}
          />
        )}
      </WidgetBoard>
    </DashboardFrame>
  );
}
