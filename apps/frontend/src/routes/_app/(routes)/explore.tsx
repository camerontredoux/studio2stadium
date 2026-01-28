import { Input } from "@/components/ui/input";
import { queries } from "@/features/explore/api/queries";
import { UserList } from "@/features/explore/components/user-list";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/_app/(routes)/explore")({
  beforeLoad: ({ context: { access } }) => {
    access.guard(access.is("core", "dancer"));
  },
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(queries.explore());
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-2">
      <Suspense fallback={<div>Loading...</div>}>
        <UserList />
      </Suspense>
      <Input placeholder="Search" />
      <div className="rounded-xl border p-4 aspect-video"></div>
      <div className="rounded-xl border p-4 aspect-video"></div>
      <div className="rounded-xl border p-4 aspect-video"></div>
    </div>
  );
}
