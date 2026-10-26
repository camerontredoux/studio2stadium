import { createFileRoute, redirect } from "@tanstack/react-router";

import { orgQueries } from "@/features/org/api/queries";
import { dancerEventSearchSchema } from "@/features/org/api/scouting-schemas";

// Its content now lives on the dancer dashboard (the Videos widget).
export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/dancer/video-library",
)({
  validateSearch: dancerEventSearchSchema,
  beforeLoad: async ({ context, params, search }) => {
    const data = await context.queryClient.ensureQueryData(
      orgQueries.org(params.orgSlug),
    );
    const features = (data.features ?? {}) as Record<string, boolean>;
    if (!features.video_library) {
      throw redirect({ to: "/o/$orgSlug/dancer", params });
    }
    throw redirect({
      to: "/o/$orgSlug/dancer/event-info",
      params,
      search: search.eventId ? { eventId: search.eventId } : {},
    });
  },
});
