import { OnboardingForm } from "@/features/onboarding/components/onboarding-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_onboarding/(routes)/onboarding/")({
  component: OnboardingForm,
});
