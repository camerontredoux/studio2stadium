import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/library")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/library"!</div>;
}
