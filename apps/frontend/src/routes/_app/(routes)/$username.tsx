import { dancerQueries } from "@/features/dancer/api/queries";
import { DancerProfile } from "@/features/dancer/components/dancer-profile";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/$username")({
  beforeLoad: ({ context: { access }, params }) => {
    access.guard(access.is("core", "school"), access.self(params.username));
  },
  loader: async ({ context: { queryClient, session }, params }) => {
    const dancer = await queryClient.ensureQueryData(
      dancerQueries.profile(params.username),
    );
    if (session.type === "school") {
      queryClient.ensureQueryData(dancerQueries.metadata(dancer.id));
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { username } = Route.useParams();

  return <DancerProfile username={username} />;
}
