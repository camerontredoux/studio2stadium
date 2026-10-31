import { createFileRoute, redirect } from "@tanstack/react-router";

import { orgQueries } from "@/features/org/api/queries";
import { dancerEventSearchSchema } from "@/features/org/api/scouting-schemas";
import {
  hasOrgFeature,
  viewedDancerEventId,
} from "@/features/org/lib/entitlement";
import { queries as sessionQueries } from "@/lib/session";

// Its content now lives on the dancer dashboard (the Top choices widget and the Coaches page).
export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/dancer/schools",
)({
  validateSearch: dancerEventSearchSchema,
  beforeLoad: async ({ context, params, search }) => {
    const data = await context.queryClient.ensureQueryData(
      orgQueries.org(params.orgSlug),
    );
    // Gate on the event the dancer asked for, not the Org's active one (#110).
    const session = await context.queryClient.ensureQueryData(
      sessionQueries.session(),
    );
    const eventId = viewedDancerEventId(data.myRosters, search.eventId);
    if (
      !hasOrgFeature(
        { ...data, platformRole: session?.role },
        "school_selections",
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
