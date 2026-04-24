import { $api } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { Heart } from "lucide-react";
import { useOrg } from "@/features/org/context/use-org";
import type { MouseEvent } from "react";

export function FavoriteButton({
  dancerRosterId,
  isFavorited,
}: {
  dancerRosterId: string;
  isFavorited: boolean;
}) {
  const { org } = useOrg();
  const qc = useQueryClient();
  const dancerKey = scoutingQueries.dancer(org.slug, dancerRosterId).queryKey;
  const favKey = scoutingQueries.favorites(org.slug).queryKey;

  const add = $api.useMutation("post", "/orgs/{slug}/favorites", {
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: dancerKey });
      const previousDancer = qc.getQueryData(dancerKey);
      qc.setQueryData(dancerKey, (old: any) => {
        if (!old) return old;
        return { ...old, isFavorited: true };
      });
      return { previousDancer };
    },
    onError: (_err, _variables, context: any) => {
      if (context?.previousDancer) {
        qc.setQueryData(dancerKey, context.previousDancer);
      }
    },
    meta: {
      invalidateQueries: [
        favKey,
        scoutingQueries.dancers(org.slug).queryKey,
        scoutingQueries.rankings(org.slug).queryKey,
      ],
    },
  });

  const remove = $api.useMutation(
    "delete",
    "/orgs/{slug}/favorites/{dancerRosterId}",
    {
      onMutate: async () => {
        await qc.cancelQueries({ queryKey: dancerKey });
        const previousDancer = qc.getQueryData(dancerKey);
        qc.setQueryData(dancerKey, (old: any) => {
          if (!old) return old;
          return { ...old, isFavorited: false };
        });
        return { previousDancer };
      },
      onError: (_err, _variables, context: any) => {
        if (context?.previousDancer) {
          qc.setQueryData(dancerKey, context.previousDancer);
        }
      },
      meta: {
        invalidateQueries: [
          favKey,
          scoutingQueries.dancers(org.slug).queryKey,
          scoutingQueries.rankings(org.slug).queryKey,
        ],
      },
    },
  );

  const toggle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.vibrate?.(10);
    if (isFavorited) {
      remove.mutate({
        params: { path: { slug: org.slug, dancerRosterId } },
      });
    } else {
      add.mutate({
        params: { path: { slug: org.slug } },
        body: { dancerRosterId },
      });
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="hover:bg-accent flex size-11 items-center justify-center rounded-full transition-colors"
      aria-label={isFavorited ? "Unfavorite" : "Favorite"}
      aria-pressed={isFavorited}
    >
      <Heart
        className={`size-5 ${isFavorited ? "fill-current text-red-500" : "text-muted-foreground"}`}
      />
    </button>
  );
}
