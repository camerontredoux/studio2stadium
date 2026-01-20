import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      Settings Layout
      <Outlet />
    </div>
  );
}
