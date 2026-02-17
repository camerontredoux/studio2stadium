import { useCountdown } from "@/components/hooks/use-countdown";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { useFavoriteDancer, useUnfavoriteDancer } from "@/shared/api/mutations";
import { HeartIcon } from "lucide-react";

export function FavoriteButton({
  id,
  isFavorited,
}: {
  id: string;
  isFavorited: boolean;
}) {
  const { mutate: favorite } = useFavoriteDancer(id);
  const { mutate: unfavorite } = useUnfavoriteDancer(id);

  const [retryAfter, startCountdown] = useCountdown();

  const handleClick = () => {
    const mutate = isFavorited ? unfavorite : favorite;
    mutate(
      { params: { path: { id } } },
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
