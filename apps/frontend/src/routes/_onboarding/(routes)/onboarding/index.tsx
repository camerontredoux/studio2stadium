import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApplicationForm } from "@/features/onboarding/components/application-form";
import { OnboardingForm } from "@/features/onboarding/components/onboarding-form";
import { useLogout, useSession } from "@/lib/session";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/_onboarding/(routes)/onboarding/")({
  validateSearch: searchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  const session = useSession();
  const { redirect } = Route.useSearch();

  const { mutate, isPending } = useLogout();

  return (
    <div className="flex w-full flex-col space-y-4">
      {session.type === "school" ? (
        <ApplicationForm />
      ) : (
        <OnboardingForm redirect={redirect} />
      )}
      <Button
        variant="link"
        className="ml-auto"
        onClick={() => mutate({})}
        disabled={isPending}
      >
        {isPending ? <Spinner label="Logging out..." /> : "Logout"}
      </Button>
    </div>
  );
}
