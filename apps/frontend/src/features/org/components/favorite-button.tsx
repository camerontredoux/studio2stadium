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
  const add = $api.useMutation("post", "/orgs/{slug}/favorites");
  const remove = $api.useMutation("delete", "/orgs/{slug}/favorites/{dancerRosterId}");

  const toggle = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.vibrate?.(10);
    const favKey = scoutingQueries.favorites(org.slug).queryKey;
    try {
      if (isFavorited) {
        await remove.mutateAsync({
          params: { path: { slug: org.slug, dancerRosterId } },
        });
      } else {
        await add.mutateAsync({
          params: { path: { slug: org.slug } },
          body: { dancerRosterId },
        });
      }
      qc.invalidateQueries({ queryKey: favKey });
    } catch {
      // Will be retried on next click; a toast could be added later
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex size-11 items-center justify-center rounded-full hover:bg-accent transition-colors"
      aria-label={isFavorited ? "Unfavorite" : "Favorite"}
      aria-pressed={isFavorited}
    >
      <Heart
        className={`size-5 ${isFavorited ? "fill-current text-red-500" : "text-muted-foreground"}`}
      />
    </button>
  );
}
