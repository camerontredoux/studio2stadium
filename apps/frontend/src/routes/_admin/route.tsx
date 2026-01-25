import { ToastProvider } from "@/components/ui/toast";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ToastProvider>
      Admin Dashboard
      <Outlet />
    </ToastProvider>
  );
}
