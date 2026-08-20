import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  redirect,
  useParams,
} from "@tanstack/react-router";
import { MegaphoneIcon, SchoolIcon } from "lucide-react";

import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { orgQueries } from "@/features/org/api/queries";
import { AccentDot } from "@/features/org/components/dashboard-shared";
import { dancerEventSearchSchema } from "@/features/org/api/scouting-schemas";
import { useOrg } from "@/features/org/context/use-org";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/dancer/callbacks",
)({
  validateSearch: dancerEventSearchSchema,
  beforeLoad: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
      orgQueries.org(params.orgSlug),
    );
    const features = (data.features ?? {}) as Record<string, boolean>;
    if (!features.callbacks) {
      throw redirect({ to: "/o/$orgSlug/dancer", params });
    }
  },
  loaderDeps: ({ search }) => ({ eventId: search.eventId }),
  loader: async ({ context, params, deps }) => {
    const org = await context.queryClient.ensureQueryData(
      orgQueries.org(params.orgSlug),
    );
    const eventId =
      deps.eventId ??
      org.myRosters.find((roster) => roster.type === "dancer")?.eventId;
    if (!eventId) {
      throw redirect({ to: "/o/$orgSlug/dancer", params });
    }
    await context.queryClient.ensureQueryData(
      scoutingQueries.dancerCallbacks(params.orgSlug, eventId),
    );
  },
  component: DancerCallbacksPage,
});

function DancerCallbacksPage() {
  const { orgSlug } = useParams({
    from: "/_org/o/$orgSlug/_authenticated/dancer/callbacks",
  });
  const { eventId: searchEventId } = Route.useSearch();
  const { myRosters } = useOrg();
  const eventId =
    searchEventId ??
    myRosters.find((roster) => roster.type === "dancer")?.eventId ??
    "";
  const { data } = useSuspenseQuery(
    scoutingQueries.dancerCallbacks(orgSlug, eventId),
  );

  const schools = data.callbacks;
  const isReleased = data.publishedShowcaseCount > 0;

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
              {isReleased
                ? `${schools.length} school${schools.length === 1 ? "" : "s"} called you back`
                : "Results not released yet"}
            </span>
          </div>
          <MegaphoneIcon className="text-muted-foreground size-4 opacity-40" />
        </div>

        {schools.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 px-6 py-24 text-center">
            <MegaphoneIcon className="size-8 opacity-40" />
            <p className="text-sm">
              {isReleased ? "No callbacks yet" : "Results not released yet"}
            </p>
            <p className="text-xs opacity-60">
              {isReleased
                ? "Schools that call you back will appear here."
                : "Your event hasn't released callback results yet. Check back after the showcase — schools that called you back will appear here."}
            </p>
          </div>
        ) : (
          <div className="divide-border divide-y">
            {schools.map((cb) => (
              <Link
                key={cb.coachRosterId}
                to="/o/$orgSlug/dancer/schools"
                params={{ orgSlug }}
                search={{ eventId }}
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
                {cb.showcaseNumbers.length > 0 && (
                  <span className="text-muted-foreground shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                    {cb.showcaseNumbers.length === 1
                      ? `Showcase ${cb.showcaseNumbers[0]}`
                      : `Showcases ${cb.showcaseNumbers.join(", ")}`}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
