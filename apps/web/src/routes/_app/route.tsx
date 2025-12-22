import { Header } from "@/components/header";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <div className="h-16">
        <Header />
      </div>
      <Outlet />
    </div>
  );
}
