import { Panel } from "@/components/event/panel";
import { ShellHeader, WidgetBoard } from "@/components/event/shell";
import { matches, SHELL_MEDIA } from "@/components/event/shell/breakpoints";
import type { OrgEvent } from "@/features/org/api/admin-queries";
import type { MyRoster } from "@/features/org/context/org-context";
import { useOrg } from "@/features/org/context/use-org";
import { EventDashboardHeader } from "@/features/org/live/shared/event-header";
import {
  EventDetailsBar,
  EventRail,
} from "@/features/org/live/shared/event-rail";
import { ScheduleWidget } from "@/features/org/live/shared/schedule-widget";
import { ShellPage } from "@/features/org/live/shared/shell-slots";
import { useActiveOrgEvent } from "@/features/org/live/shared/use-active-org-event";
import { VideosWidget } from "@/features/org/live/shared/videos-widget";

import { CallbacksWidget } from "./callbacks-widget";
import { CheckInPassWidget } from "./check-in-pass-widget";
import { TopChoicesWidget } from "./top-choices-widget";
import { useDancerScouting } from "./use-dancer-scouting";

/**
 * Schedule first; Check-in last, so it sits alone on row 2 while every widget
 * is a peek and joins the strips at the end when one opens (the mockup's board).
 * A widget the org's features leave out is not shown.
 */
const WIDGETS = [
  { id: "schedule" },
  { id: "top-choices", feature: "school_selections" },
  { id: "callbacks", feature: "callbacks" },
  { id: "videos", feature: "video_library" },
  { id: "check-in", feature: "check_in" },
] as const;

/**
 * The dancer dashboard at /o/:orgSlug/dancer/event-info, for the event picked
 * in the sidebar switcher (`useActiveOrgEvent`).
 */
export function DancerDashboardPage() {
  const { event, roster, isLoading } = useActiveOrgEvent();

  if (!event) {
    if (isLoading) return null;
    return (
      <ShellPage header={<ShellHeader title="Dashboard" />}>
        <Panel className="flex flex-col gap-(--space-4) p-(--space-16)">
          <h2 className="type-title text-fg m-0">No event yet</h2>
          <p className="type-body text-fg-2 m-0">
            You’re not on an event roster in this organization yet. Once the
            organizer adds you, your check-in pass, schedule and callbacks show
            up here.
          </p>
        </Panel>
      </ShellPage>
    );
  }
  // Keyed so the open widget resets when the dancer switches events.
  return <Dashboard key={event.id} event={event} roster={roster} />;
}

function Dashboard({
  event,
  roster,
}: {
  event: OrgEvent;
  roster: MyRoster | null;
}) {
  const { hasFeature } = useOrg();
  const scouting = useDancerScouting(event, roster, { allSchools: false });
  const order = WIDGETS.filter(
    // Gate on the event shown here, which is the one its reads request, not
    // the Org's active one (#110).
    (widget) => !("feature" in widget) || hasFeature(widget.feature, event.id),
  ).map((widget) => widget.id);
  const shows = (id: (typeof WIDGETS)[number]["id"]) => order.includes(id);

  return (
    <ShellPage
      header={<EventDashboardHeader event={event} />}
      rail={<EventRail event={event} />}
    >
      <EventDetailsBar event={event} />
      <WidgetBoard
        order={order}
        firstRow={4}
        defaultOpen={matches(SHELL_MEDIA.phone) ? null : "schedule"}
      >
        <ScheduleWidget event={event} mode="viewer" />
        {shows("top-choices") && <TopChoicesWidget scouting={scouting} />}
        {shows("callbacks") && <CallbacksWidget scouting={scouting} />}
        {shows("videos") && <VideosWidget event={event} />}
        {shows("check-in") && <CheckInPassWidget event={event} />}
      </WidgetBoard>
    </ShellPage>
  );
}
