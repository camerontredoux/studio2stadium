import { EventsLayout } from "@/components/layouts/events-layout";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/events")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <EventsLayout>
      <Outlet />
    </EventsLayout>
  );
}
