import { createFileRoute, useParams } from "@tanstack/react-router";
import { useDeferredValue, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { DancerCard } from "@/features/org/components/dancer-card";
import { useBibQuickJump } from "@/features/org/hooks/use-bib-quick-jump";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/coach/dancers/",
)({
  component: DancerSearch,
});

function DancerSearch() {
  const { orgSlug } = useParams({
    from: "/_org/$orgSlug/_authenticated/coach/dancers/",
  });
  const [search, setSearch] = useState("");
  const deferred = useDeferredValue(search);
  const { data } = useSuspenseQuery(
    scoutingQueries.dancers(orgSlug, deferred ? { search: deferred } : {}),
  );
  const { data: favorites } = useSuspenseQuery(
    scoutingQueries.favorites(orgSlug),
  );
  const quickJump = useBibQuickJump(orgSlug);

  const favoritedIds = new Set(
    Array.isArray(favorites) ? favorites.map((f) => f.rosterId) : [],
  );

  return (
    <div className="flex flex-col gap-4">
      <Input
        autoFocus
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            const jumped = await quickJump(search);
            if (jumped) setSearch("");
          }
        }}
        placeholder="Search name or bib…"
        className="h-11"
        inputMode="search"
      />
      {data.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {deferred
            ? `No dancers matched "${deferred}".`
            : "Type to search dancers."}
        </p>
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
