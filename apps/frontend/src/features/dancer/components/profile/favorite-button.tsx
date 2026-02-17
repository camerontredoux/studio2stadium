import { useCountdown } from "@/components/hooks/use-countdown";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { useFavoriteDancer, useUnfavoriteDancer } from "@/shared/api/mutations";
import type { FavoritedDancer } from "@/shared/types";
import { HeartIcon } from "lucide-react";

export function FavoriteButton({
  dancer,
  isFavorited,
}: {
  dancer: FavoritedDancer;
  isFavorited: boolean;
}) {
  const { mutate: favorite } = useFavoriteDancer(dancer);
  const { mutate: unfavorite } = useUnfavoriteDancer(dancer);

  const [retryAfter, startCountdown] = useCountdown();

  const handleClick = () => {
    const mutate = isFavorited ? unfavorite : favorite;
    mutate(
      {
        params: {
          path: { id: dancer.id },
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
      onClick={handleClick}
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
