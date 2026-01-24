import { ToastProvider } from "@/components/ui/toast";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ToastProvider>
      Settings Layout
      <Outlet />
    </ToastProvider>
  );
}
