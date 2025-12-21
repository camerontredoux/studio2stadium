import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(profiles)/school/$username")({
  component: RouteComponent,
});

function RouteComponent() {
  const { username } = Route.useParams();
  return <div>Hello "/_app/school/${username}"!</div>;
}
