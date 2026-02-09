import { queries } from "@/features/dancer/api/queries";
import { DancerProfile } from "@/features/dancer/components/dancer-profile";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/$username")({
  beforeLoad: ({ context: { access }, params }) => {
    access.guard(access.is("core", "school"), access.self(params.username));
  },
  loader: ({ context: { queryClient }, params }) => {
    queryClient.ensureQueryData(queries.detail(params.username));
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { username } = Route.useParams();

  return <DancerProfile username={username} />;
}
