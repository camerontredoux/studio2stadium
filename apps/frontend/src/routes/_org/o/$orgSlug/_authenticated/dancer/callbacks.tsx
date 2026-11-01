import { createFileRoute, redirect } from "@tanstack/react-router";

import { orgQueries } from "@/features/org/api/queries";
import {
  hasOrgFeature,
  viewedDancerEventId,
} from "@/features/org/lib/entitlement";
import { queries as sessionQueries } from "@/lib/session";
import { dancerEventSearchSchema } from "@/features/org/api/scouting-schemas";

// Its content now lives on the dancer dashboard (the Callbacks widget).
export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/dancer/callbacks",
)({
  validateSearch: dancerEventSearchSchema,
  beforeLoad: async ({ context, params, search }) => {
    const data = await context.queryClient.ensureQueryData(
      orgQueries.org(params.orgSlug),
    );
    // Gate on the event this page will request, not the Org's active one:
    // the backend gates a Dancer's reads on the event she asks for (#110).
    const session = await context.queryClient.ensureQueryData(
      sessionQueries.session(),
    );
    const eventId = viewedDancerEventId(data.myRosters, search.eventId);
    if (
      !hasOrgFeature(
        { ...data, platformRole: session?.role },
        "callbacks",
        eventId,
      )
    ) {
      throw redirect({ to: "/o/$orgSlug/dancer", params });
    }
    throw redirect({
      to: "/o/$orgSlug/dancer/event-info",
      params,
      search: search.eventId ? { eventId: search.eventId } : {},
    });
  },
});
