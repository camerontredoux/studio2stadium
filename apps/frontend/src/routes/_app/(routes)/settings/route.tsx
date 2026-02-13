import { SettingsLayout } from "@/components/layouts/settings-layout";
import { ToastProvider } from "@/components/ui/toast";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ToastProvider position="top-center">
      <SettingsLayout>
        <Outlet />
      </SettingsLayout>
    </ToastProvider>
  );
}
