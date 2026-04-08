import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { queries } from "@/lib/session";

export const Route = createFileRoute("/_org/$orgSlug/_authenticated")({
  beforeLoad: async ({ context, location, params }) => {
    const session = await context.queryClient.ensureQueryData(queries.session());
    if (!session) {
      throw redirect({
        to: "/$orgSlug/login",
        params: { orgSlug: params.orgSlug },
        search: { redirect: location.href },
      });
    }
    return { session };
  },
  component: () => <Outlet />,
});
