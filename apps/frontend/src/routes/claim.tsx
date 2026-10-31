import { AuthLayout } from "@/components/layouts/auth-layout";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { claimSchemas } from "@/features/claim/api/schemas";
import { ClaimOrg } from "@/features/claim/components/claim-org";
import { queries } from "@/lib/session";
import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Where a claim link lands (ADR 0007). Outside `_auth`, which turns signed-in
 * users away, and outside `_app`, which sends a user without a profile to
 * onboarding: claiming needs a signed-in user and nothing more.
 */
export const Route = createFileRoute("/claim")({
  validateSearch: claimSchemas.claimSearch,
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(
      queries.session(),
    );

    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href, reason: "claim_sign_in" },
      });
    }

    return { session };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const { token, userId } = Route.useSearch();

  return (
    <AuthLayout
      cardHeader={
        <>
          <CardTitle>Claim your Org</CardTitle>
          <CardDescription>Signed in as {session.displayEmail}</CardDescription>
        </>
      }
    >
      <ClaimOrg session={session} token={token} userId={userId} />
    </AuthLayout>
  );
}
