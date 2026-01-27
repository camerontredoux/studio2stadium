import { queries } from "@/features/explore/api/queries";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/explore")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(queries.explore()),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border p-4 aspect-video"></div>
      <div className="rounded-xl border p-4 aspect-video"></div>
      <div className="rounded-xl border p-4 aspect-video"></div>
    </div>
  );
}
