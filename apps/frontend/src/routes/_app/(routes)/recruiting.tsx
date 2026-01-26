import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/recruiting")({
  component: RouteComponent,
});

function RouteComponent() {
  const { username } = Route.useParams();
  return <div>Hello "/_app/(routes)/u/{username}/recruiting"!</div>;
}
