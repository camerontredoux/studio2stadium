import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/settings/_settings/portfolio")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/(routes)/settings/portfolio"!</div>;
}
