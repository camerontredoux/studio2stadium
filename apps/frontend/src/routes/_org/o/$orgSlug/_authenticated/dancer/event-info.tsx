import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useCallbackRef } from "@/components/hooks/use-callback-ref";
import { dancerEventSearchSchema } from "@/features/org/api/scouting-schemas";
import { DancerDashboardPage } from "@/features/org/live/dancer/dashboard-page";
import { useActiveOrgEvent } from "@/features/org/live/shared/use-active-org-event";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/dancer/event-info",
)({
  // Old links (/dancer/callbacks?eventId=…) land here with the event to show.
  validateSearch: dancerEventSearchSchema,
  component: DancerEventInfo,
});

function DancerEventInfo() {
  const { eventId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { selectEvent } = useActiveOrgEvent();
  const select = useCallbackRef(selectEvent);

  // Hand an `eventId` from the URL to the sidebar switcher once, then drop it
  // so later switches aren't undone by the URL.
  useEffect(() => {
    if (!eventId) return;
    select(eventId);
    void navigate({ search: {}, replace: true });
  }, [eventId, select, navigate]);

  return <DancerDashboardPage />;
}
