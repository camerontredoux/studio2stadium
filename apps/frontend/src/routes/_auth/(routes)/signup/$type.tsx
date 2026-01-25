import { SignupForm } from "@/features/signup/components/signup-form";
import { schemas } from "@/features/signup/schemas";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(routes)/signup/$type")({
  validateSearch: schemas.search,
  beforeLoad: async ({ search }) => {
    if (!search.username) {
      throw redirect({ to: "/signup" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <SignupForm />;
}
