import { createFileRoute, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { DancerCard } from "@/features/org/components/dancer-card";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/coach/favorites",
)({
  component: Favorites,
});

function Favorites() {
  const { orgSlug } = useParams({
    from: "/_org/$orgSlug/_authenticated/coach/favorites",
  });
  const { data } = useSuspenseQuery(scoutingQueries.favorites(orgSlug));
  const favoritedIds = new Set(data.map((d) => d.rosterId));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">Favorites</h1>
        <span className="text-muted-foreground text-sm">
          {data.length} {data.length === 1 ? "dancer" : "dancers"}
        </span>
      </div>
      {data.length === 0 ? (
        <div className="text-muted-foreground bg-card rounded-lg border p-8 text-center text-sm">
          You haven't favorited any dancers yet. Tap the heart on a dancer to
          save them here.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((d) => (
            <DancerCard
              key={d.rosterId}
              dancer={d}
              slug={orgSlug}
              isFavorited={favoritedIds.has(d.rosterId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
