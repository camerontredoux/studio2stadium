import { auth } from "@/features/auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(routes)/login")({
  validateSearch: auth.schemas.search,
  component: RouteComponent,
});

function RouteComponent() {
  const { redirect } = Route.useSearch()
  const navigate = Route.useNavigate();

  return <div>Hello "/_auth/login"! {redirect} <button onClick={() => navigate({ to: redirect ?? "/" })}>Go to explore</button></div>;
}
