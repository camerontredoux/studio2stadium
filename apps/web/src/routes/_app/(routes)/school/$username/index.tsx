import { queries } from "@/features/school/api/queries";
import { SchoolProfile } from "@/features/school/components/school-profile";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/school/$username/")({
  beforeLoad: ({ context: { access }, params }) => {
    access.guard(access.is("core", "dancer"), access.self(params.username));
  },
  loader: ({ context: { queryClient }, params }) => {
    queryClient.ensureQueryData(queries.detail(params.username));
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { username } = Route.useParams();

  return <SchoolProfile username={username} />;
}
