import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isReservedOrgSlug } from "@/features/org/lib/reserved-slugs";
import { queries } from "@/lib/session";

export const Route = createFileRoute("/_org/o/$orgSlug/_authenticated")({
  skipRouteOnParseError: { params: true },
  params: {
    parse: ({ orgSlug }) => {
      if (isReservedOrgSlug(orgSlug)) throw new Error("reserved-slug");
      return { orgSlug };
    },
    stringify: ({ orgSlug }) => ({ orgSlug }),
  },
  beforeLoad: async ({ context, location, params }) => {
    const session = await context.queryClient.ensureQueryData(
      queries.session(),
    );
    if (!session) {
      throw redirect({
        to: "/o/$orgSlug/login",
        params: { orgSlug: params.orgSlug },
        search: { redirect: location.href },
      });
    }
    return { session };
  },
  component: () => <Outlet />,
});
