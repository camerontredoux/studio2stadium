import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { OrgProvider } from "@/features/org/context/org-provider";
import { ThemedPending } from "@/features/org/components/themed-pending";
import { orgQueries } from "@/features/org/api/queries";
import { ToastProvider } from "@/components/ui/toast";

export const Route = createFileRoute("/_org")({
  beforeLoad: async ({ context, params }) => {
    const slug = (params as { orgSlug?: string }).orgSlug;
    if (!slug) return;
    await context.queryClient.ensureQueryData(orgQueries.org(slug));
  },
  pendingComponent: ThemedPending,
  component: OrgLayout,
});

function OrgLayout() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };
  return (
    <OrgProvider slug={orgSlug}>
      <ToastProvider position="top-center">
        <Outlet />
      </ToastProvider>
    </OrgProvider>
  );
}
