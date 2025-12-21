import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/explore")({
  loader: () => {
    return { test: "asd" };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { test } = Route.useLoaderData();
  return <div>{test}</div>;
}
