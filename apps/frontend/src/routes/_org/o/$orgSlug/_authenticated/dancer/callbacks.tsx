import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useParams } from "@tanstack/react-router";
import { SchoolIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { scoutingQueries } from "@/features/org/api/scouting-queries";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/dancer/callbacks",
)({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
      scoutingQueries.dancerCallbacks(params.orgSlug),
    );
    if (!data || (Array.isArray(data) && data.length === 0)) {
      throw redirect({ to: "/o/$orgSlug/dancer", params });
    }
  },
  component: DancerCallbacksPage,
});

function DancerCallbacksPage() {
  const { orgSlug } = useParams({
    from: "/_org/o/$orgSlug/_authenticated/dancer/callbacks",
  });
  const { data: callbacks } = useSuspenseQuery(
    scoutingQueries.dancerCallbacks(orgSlug),
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <header className="flex items-center gap-3 px-4 py-4">
        <h1 className="text-lg font-semibold tracking-tight">Callbacks</h1>
        <span className="text-muted-foreground text-xs">
          {(callbacks as any[]).length} school
          {(callbacks as any[]).length === 1 ? "" : "s"} called you back
        </span>
      </header>

      <div className="flex-1 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(
            callbacks as {
              coachRosterId: string;
              firstName: string;
              lastName: string;
              organization: string | null;
            }[]
          ).map((cb) => (
            <div
              key={cb.coachRosterId}
              className="bg-card flex items-center gap-3 rounded-xl border p-4"
            >
              <Avatar className="size-10">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {cb.organization
                    ? cb.organization.charAt(0).toUpperCase()
                    : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {cb.organization || "Unknown School"}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {cb.firstName} {cb.lastName}
                </p>
              </div>
              <SchoolIcon className="text-muted-foreground size-4 shrink-0 opacity-40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
