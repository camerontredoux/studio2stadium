import { ApplicationForm } from "@/features/onboarding/components/application-form";
import { OnboardingForm } from "@/features/onboarding/components/onboarding-form";
import { useSession } from "@/lib/session";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_onboarding/(routes)/onboarding/")({
  component: RouteComponent,
});

function RouteComponent() {
  const session = useSession();

  if (session.type === "school") {
    return <ApplicationForm />;
  }

  return <OnboardingForm />;
}
