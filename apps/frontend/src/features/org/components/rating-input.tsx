import { $api } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import { useOptimistic, useTransition } from "react";

export function RatingInput({
  value,
  max,
  dancerRosterId,
}: {
  value: number | null;
  max: number;
  dancerRosterId: string;
}) {
  const { org } = useOrg();
  const qc = useQueryClient();
  const [optimistic, setOptimistic] = useOptimistic<number | null, number>(
    value,
    (_, next) => next,
  );
  const [, startTransition] = useTransition();
  const mutate = $api.useMutation(
    "put",
    "/orgs/{slug}/dancers/{dancerRosterId}/rating",
  );

  const onSet = (n: number) => {
    navigator.vibrate?.(10);
    startTransition(async () => {
      setOptimistic(n);
      try {
        await mutate.mutateAsync({
          params: { path: { slug: org.slug, dancerRosterId } },
          body: { rating: n },
        });
        qc.invalidateQueries({
          queryKey: scoutingQueries.dancer(org.slug, dancerRosterId).queryKey,
        });
      } catch {
        // will revert on next render if the server query refetches
      }
    });
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1"
      role="radiogroup"
      aria-label="Rating"
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
        const active = optimistic !== null && optimistic >= n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={optimistic === n}
            aria-label={`Rating ${n}`}
            onClick={() => onSet(n)}
            className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-accent"
          >
            <span
              className={`block size-4 rounded-full transition-colors ${
                active ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            />
          </button>
        );
      })}
      {optimistic !== null && (
        <span className="text-muted-foreground ml-2 text-sm">
          {optimistic}/{max}
        </span>
      )}
    </div>
  );
}
