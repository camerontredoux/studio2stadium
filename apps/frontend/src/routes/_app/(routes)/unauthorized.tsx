import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/unauthorized")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-2 max-lg:pb-14 lg:gap-4">
      <div className="flex flex-col gap-2 lg:gap-4">
        <h1 className="text-2xl font-bold">Unauthorized</h1>
        <p className="text-muted-foreground text-sm">
          You are not authorized to access this page.
        </p>
      </div>
    </div>
  );
}
