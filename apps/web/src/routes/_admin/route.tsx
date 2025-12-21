import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      Admin Dashboard
      <Outlet />
    </div>
  );
}
