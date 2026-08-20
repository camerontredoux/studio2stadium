import { useQuery } from "@tanstack/react-query";
import { Loader2Icon, SchoolIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { scoutingQueries } from "@/features/org/api/scouting-queries";

/**
 * Which schools called this dancer back — admin-only. Includes callbacks the
 * current showcase has not published yet, so support can tell a dancer who to
 * connect with before results are released.
 */
export function DancerCallbackList({
  orgSlug,
  dancerRosterId,
}: {
  orgSlug: string;
  dancerRosterId: string;
}) {
  const { data: callbacks, isLoading } = useQuery(
    scoutingQueries.dancerCallbackDetail(orgSlug, dancerRosterId),
  );

  return (
    <div>
      <label className="text-muted-foreground mb-1 block text-xs tracking-wide uppercase">
        Callbacks
      </label>

      {isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-2 text-sm">
          <Loader2Icon className="size-4 animate-spin" />
          Loading callbacks
        </div>
      ) : !callbacks || callbacks.length === 0 ? (
        <p className="text-muted-foreground/50 text-sm italic">
          No schools have called this dancer back
        </p>
      ) : (
        <ul className="divide-border border-border divide-y rounded-md border">
          {callbacks.map((cb) => (
            <li
              key={`${cb.showcaseId}-${cb.coachRosterId}`}
              className="flex items-center gap-2.5 px-2.5 py-2"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded border border-blue-500/20 bg-blue-500/10">
                <SchoolIcon className="size-3 text-blue-600 dark:text-blue-400" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {cb.organization || "Unknown School"}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {cb.firstName} {cb.lastName} · Showcase {cb.showcaseNumber}
                </p>
              </div>
              <Badge variant={cb.isPublished ? "success" : "warning"}>
                {cb.isPublished ? "Released" : "Not released"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
