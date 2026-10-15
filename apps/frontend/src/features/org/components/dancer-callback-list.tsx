import { useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import {
  SchoolAvatar,
  SchoolNameLink,
} from "@/features/org/components/school-identity";

/**
 * Which schools called this dancer back.
 *
 * Admins see every program that called the dancer back (including callbacks the
 * current showcase has not published yet), so support can tell a dancer who to
 * connect with before results are released. A coach sees only their own
 * program — never which other programs called the dancer back — enforced
 * server-side by the coach-scoped endpoint.
 */
export function DancerCallbackList({
  orgSlug,
  dancerRosterId,
  admin = false,
}: {
  orgSlug: string;
  dancerRosterId: string;
  admin?: boolean;
}) {
  // Both responses share the same shape; only the active one fetches. Admins
  // get every program, coaches get just their own (scoped server-side).
  const adminQuery = useQuery({
    ...scoutingQueries.dancerCallbackDetail(orgSlug, dancerRosterId),
    enabled: admin,
  });
  const coachQuery = useQuery({
    ...scoutingQueries.coachDancerCallbackDetail(orgSlug, dancerRosterId),
    enabled: !admin,
  });
  const { data: callbacks, isLoading } = admin ? adminQuery : coachQuery;

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
          {admin
            ? "No schools have called this dancer back"
            : "You haven't called this dancer back"}
        </p>
      ) : (
        <ul className="divide-border border-border divide-y rounded-md border">
          {callbacks.map((cb) => {
            const allReleased = cb.releasedCount === cb.callbackCount;
            const noneReleased = cb.releasedCount === 0;
            return (
              <li
                key={cb.coachRosterId}
                className="flex items-center gap-2.5 px-2.5 py-2"
              >
                <SchoolAvatar
                  avatarUrl={cb.avatarUrl}
                  organization={cb.organization}
                  className="size-6"
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <SchoolNameLink
                    username={cb.username}
                    organization={cb.organization}
                    className="text-sm font-medium"
                  />
                  <p className="text-muted-foreground truncate text-xs">
                    {cb.firstName} {cb.lastName} ·{" "}
                    {cb.showcaseNumbers.length === 1
                      ? `Showcase ${cb.showcaseNumbers[0]}`
                      : `Showcases ${cb.showcaseNumbers.join(", ")}`}
                  </p>
                </div>
                <Badge variant={noneReleased ? "warning" : "success"}>
                  {allReleased
                    ? "Released"
                    : noneReleased
                      ? "Not released"
                      : `${cb.releasedCount} of ${cb.callbackCount} released`}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
