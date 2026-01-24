import { queries } from "@/features/explore/api/queries";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/explore")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(queries.explore()),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/explore"!</div>;
}
