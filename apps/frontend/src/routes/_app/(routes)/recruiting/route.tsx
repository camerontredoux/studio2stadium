import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/recruiting")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
