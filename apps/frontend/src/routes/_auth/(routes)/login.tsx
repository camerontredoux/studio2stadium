import { LoginPage } from "@/features/login/components/login-page";
import { schemas } from "@/features/login/schemas";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(routes)/login")({
  validateSearch: schemas.search,
  component: RouteComponent,
});

function RouteComponent() {
  return <LoginPage />;
}
