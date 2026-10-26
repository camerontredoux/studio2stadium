import { createFileRoute, redirect } from "@tanstack/react-router";

import { orgQueries } from "@/features/org/api/queries";
import { VideoLibraryPage } from "@/features/org/live/admin/dashboard/video-library-page";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/admin/video-library",
)({
  beforeLoad: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
      orgQueries.org(params.orgSlug),
    );
    const features = (data?.features ?? {}) as Record<string, boolean>;
    if (!features.video_library) {
      throw redirect({ to: "/o/$orgSlug/admin", params });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { orgSlug } = Route.useParams();
  return <VideoLibraryPage orgSlug={orgSlug} />;
}
