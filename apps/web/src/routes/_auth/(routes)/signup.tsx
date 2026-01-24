import { SignupPage } from "@/features/signup/components/signup-page";
import { schemas } from "@/features/signup/schemas";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(routes)/signup")({
  validateSearch: schemas.search,
  component: RouteComponent,
});

function RouteComponent() {
  return <SignupPage />;
}
