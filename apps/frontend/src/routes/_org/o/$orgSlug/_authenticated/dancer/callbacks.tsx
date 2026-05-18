import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useParams } from "@tanstack/react-router";
import { MegaphoneIcon, SchoolIcon } from "lucide-react";

import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { AccentDot } from "@/features/org/components/dashboard-shared";

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

  const schools = callbacks as {
    coachRosterId: string;
    firstName: string;
    lastName: string;
    organization: string | null;
  }[];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
      <div className="border-border flex flex-col overflow-hidden rounded-md border">
        <div className="border-border bg-muted/40 flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2">
          <div className="flex min-w-0 flex-col">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase 2xl:text-xs">
              <AccentDot accent="rose" />
              Callbacks
            </span>
            <span className="text-muted-foreground text-[11px] 2xl:text-xs">
              {schools.length} school{schools.length === 1 ? "" : "s"} called
              you back
            </span>
          </div>
          <MegaphoneIcon className="text-muted-foreground size-4 opacity-40" />
        </div>

        <div className="divide-border divide-y">
          {schools.map((cb) => (
            <Link
              key={cb.coachRosterId}
              to="/o/$orgSlug/dancer/schools"
              params={{ orgSlug }}
              className="hover:bg-accent/50 flex items-center gap-3 px-3 py-2.5 transition-colors"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-blue-500/20 bg-blue-500/10">
                <SchoolIcon className="size-3.5 text-blue-600 dark:text-blue-400" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium 2xl:text-sm">
                  {cb.organization || "Unknown School"}
                </p>
                <p className="text-muted-foreground truncate text-[11px] 2xl:text-xs">
                  {cb.firstName} {cb.lastName}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
