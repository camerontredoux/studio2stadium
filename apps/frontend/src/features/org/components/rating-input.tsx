import { Rating, RatingItem } from "@/components/ui/rating";
import { $api } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import { useOptimistic, useTransition } from "react";

export function RatingInput({
  value,
  dancerRosterId,
}: {
  value: number | null;
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
          queryKey: scoutingQueries.rankings(org.slug).queryKey,
        });
      } catch {
        // reverts on next render via refetch
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Rating value={optimistic ?? 0} onValueChange={onSet}>
        {Array.from({ length: 5 }, (_, i) => (
          <RatingItem key={i} index={i} />
        ))}
      </Rating>
      {optimistic != null && (
        <span className="text-muted-foreground ml-2 text-sm">
          {optimistic}/5
        </span>
      )}
    </div>
  );
}
