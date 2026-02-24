import { useCountdown } from "@/components/hooks/use-countdown";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { useFavoriteDancer, useUnfavoriteDancer } from "@/shared/api/mutations";
import { useQuery } from "@tanstack/react-query";
import { HeartIcon } from "lucide-react";
import { dancerQueries } from "../../api/queries";

export function FavoriteButton({ dancerId }: { dancerId: string }) {
  const { data } = useQuery(dancerQueries.metadata(dancerId));

  const isFavorited = data?.favorited ?? false;

  const { mutate: favorite } = useFavoriteDancer(dancerId);
  const { mutate: unfavorite } = useUnfavoriteDancer(dancerId);

  const [retryAfter, startCountdown] = useCountdown();

  const handleClick = () => {
    const mutate = isFavorited ? unfavorite : favorite;
    mutate(
      {
        params: {
          path: { id: dancerId },
        },
      },
      {
        onError: handleApiError({
          onError: (error) => {
            toastManager.add({
              title: "Error",
              description: error.message,
              type: "error",
            });
          },
          onRateLimit: (retryAfter) => {
            startCountdown(retryAfter);
          },
        }),
      },
    );
  };

  return (
    <Button
      variant={isFavorited ? "destructive-outline" : "outline"}
      disabled={!!retryAfter}
      size="sm"
      onClick={handleClick}
      className="flex-1 gap-2"
    >
      <HeartIcon className={isFavorited ? "fill-current" : undefined} />
      {retryAfter
        ? `Retry in ${retryAfter}s`
        : isFavorited
          ? "Unfavorite"
          : "Favorite"}
    </Button>
  );
}
