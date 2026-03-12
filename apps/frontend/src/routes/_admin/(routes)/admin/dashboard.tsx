import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LuActivity,
  LuCalendar,
  LuFileText,
  LuGlobe,
  LuSchool,
  LuUsers,
} from "react-icons/lu";

export const Route = createFileRoute("/_admin/(routes)/admin/dashboard")({
  component: RouteComponent,
});

const adminLinks = [
  {
    to: "/admin/applications",
    label: "Applications",
    description: "Review and approve school applications",
    icon: LuUsers,
  },
  {
    to: "/admin/school-events",
    label: "School Events",
    description: "Add events to school profiles",
    icon: LuSchool,
  },
  {
    to: "/admin/global-events",
    label: "Global Events",
    description: "Create global dance events",
    icon: LuCalendar,
  },
  {
    to: "/admin/blog",
    label: "Blog",
    description: "Manage blog posts and articles",
    icon: LuFileText,
  },
  {
    to: "/admin/outbox-stats",
    label: "Stats",
    description: "Monitor system event metrics",
    icon: LuActivity,
  },
] as const;

function RouteComponent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage the Studio2Stadium platform
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adminLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="bg-card hover:bg-accent/50 group rounded-xl border p-5 transition-colors"
          >
            <div className="bg-primary/10 text-primary mb-3 inline-flex rounded-lg p-2.5">
              <link.icon className="size-5" />
            </div>
            <h3 className="font-semibold">{link.label}</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              {link.description}
            </p>
          </Link>
        ))}

        <Link
          to="/"
          className="bg-muted/30 hover:bg-muted/50 group flex items-center gap-3 rounded-xl border border-dashed p-5 transition-colors"
        >
          <div className="bg-muted text-muted-foreground rounded-lg p-2.5">
            <LuGlobe className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold">View Site</h3>
            <p className="text-muted-foreground text-sm">Back to main app</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
