import { Rating, RatingItem } from "@/components/ui/rating";
import { $api } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";

export function RatingInput({
  value,
  dancerRosterId,
}: {
  value: number | null;
  dancerRosterId: string;
}) {
  const { org } = useOrg();
  const qc = useQueryClient();
  const dancerKey = scoutingQueries.dancer(org.slug, dancerRosterId).queryKey;

  const mutate = $api.useMutation(
    "put",
    "/orgs/{slug}/dancers/{dancerRosterId}/rating",
    {
      onMutate: async (variables) => {
        const dancersPrefix = ["get", "/orgs/{slug}/dancers"] as const;
        await qc.cancelQueries({ queryKey: dancerKey });
        await qc.cancelQueries({ queryKey: [...dancersPrefix] });
        const previousDancer = qc.getQueryData(dancerKey);
        const rating = variables.body?.rating ?? null;
        qc.setQueryData(dancerKey, (old: any) =>
          old ? { ...old, rating } : old,
        );
        qc.setQueriesData({ queryKey: [...dancersPrefix] }, (old: any) =>
          Array.isArray(old)
            ? old.map((d: any) =>
                d.rosterId === dancerRosterId ? { ...d, rating } : d,
              )
            : old,
        );
        return { previousDancer };
      },
      onError: (_err, _variables, context: any) => {
        if (context?.previousDancer) {
          qc.setQueryData(dancerKey, context.previousDancer);
        }
        qc.invalidateQueries({ queryKey: ["get", "/orgs/{slug}/dancers"] });
      },
      meta: {
        invalidateQueries: [
          scoutingQueries.rankings(org.slug).queryKey,
        ],
      },
    },
  );

  const onSet = (n: number) => {
    navigator.vibrate?.(10);
    mutate.mutate({
      params: { path: { slug: org.slug, dancerRosterId } },
      body: { rating: n },
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Rating value={value ?? 0} onValueChange={onSet}>
        {Array.from({ length: 5 }, (_, i) => (
          <RatingItem key={i} index={i} />
        ))}
      </Rating>
      {value != null && (
        <span className="text-muted-foreground ml-2 text-sm">{value}/5</span>
      )}
    </div>
  );
}
