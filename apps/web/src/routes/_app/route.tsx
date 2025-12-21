import { Outlet, createFileRoute } from "@tanstack/react-router";
import Header from "@/components/header";

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <Header />
      <Outlet />
    </div>
  );
}
