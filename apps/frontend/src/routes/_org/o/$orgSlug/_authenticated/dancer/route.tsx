import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DancerAreaShell } from "@/features/org/live/dancer/dancer-shell";
import { orgQueries } from "@/features/org/api/queries";
import { queries } from "@/lib/session";
import {
  ORG_AREA_ROUTES,
  resolveOrgArea,
} from "@/features/org/lib/org-destination";

export const Route = createFileRoute("/_org/o/$orgSlug/_authenticated/dancer")({
  beforeLoad: async ({ context, params }) => {
    const session = await context.queryClient.ensureQueryData(
      queries.session(),
    );
    if (session?.role === "admin") return;

    const data =
      context.queryClient.getQueryData(
        orgQueries.org(params.orgSlug).queryKey,
      ) ??
      (await context.queryClient.ensureQueryData(
        orgQueries.org(params.orgSlug),
      ));
    const area = resolveOrgArea(data);
    if (area !== "dancer") {
      throw redirect({
        to: ORG_AREA_ROUTES[area],
        params: { orgSlug: params.orgSlug },
      });
    }
  },
  component: DancerLayout,
});

function DancerLayout() {
  return (
    <DancerAreaShell>
      <Outlet />
    </DancerAreaShell>
  );
}
