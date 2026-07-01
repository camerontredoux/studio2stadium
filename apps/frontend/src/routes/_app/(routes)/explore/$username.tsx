import { PremiumGuard } from "@/components/shared/premium-guard";
import { schoolQueries } from "@/features/school/api/queries";
import { SchoolProfile } from "@/features/school/components/school-profile";
import { useSession } from "@/lib/session";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/explore/$username")({
  validateSearch: (search: Record<string, unknown>) =>
    search as { mode?: "preview" | undefined },
  beforeLoad: ({ context: { access }, params }) => {
    access.guard(access.is("core", "dancer"), access.self(params.username));
  },
  loader: async ({ context: { queryClient, session }, params }) => {
    const school = await queryClient.ensureQueryData(
      schoolQueries.profile(params.username),
    );
    if (session.type === "dancer") {
      queryClient.ensureQueryData(schoolQueries.metadata(school.id));
      if (session.orgAccountTier) {
        queryClient.ensureQueryData(
          schoolQueries.eventAccess(params.username),
        );
      }
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { username } = Route.useParams();
  const session = useSession();
  const isOrgAttendee = !!session.orgAccountTier;
  const { data: access } = useQuery({
    ...schoolQueries.eventAccess(username),
    enabled: isOrgAttendee,
  });

  if (access?.eventAccess) {
    return <SchoolProfile username={username} />;
  }

  return (
    <PremiumGuard description="School profiles are a premium feature. Subscribe to unlock and view detailed school information.">
      <SchoolProfile username={username} />
    </PremiumGuard>
  );
}
