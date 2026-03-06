import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/(routes)/admin/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Admin Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          to="/admin/applications"
          className="hover:bg-muted/50 rounded-lg border p-6"
        >
          <h3 className="font-semibold">Applications</h3>
          <p className="text-muted-foreground text-sm">
            Review and approve school applications
          </p>
        </Link>
        <Link
          to="/admin/school-events"
          className="hover:bg-muted/50 rounded-lg border p-6"
        >
          <h3 className="font-semibold">School Events</h3>
          <p className="text-muted-foreground text-sm">
            Add events to school profiles
          </p>
        </Link>
        <Link
          to="/admin/global-events"
          className="hover:bg-muted/50 rounded-lg border p-6"
        >
          <h3 className="font-semibold">Global Events</h3>
          <p className="text-muted-foreground text-sm">
            Create global dance events
          </p>
        </Link>
      </div>
    </div>
  );
}
