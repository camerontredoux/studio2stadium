import { useCountdown } from "@/components/hooks/use-countdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { RecommendedDancer as RecommendedDancerType } from "@/features/feed/types";
import { handleApiError } from "@/lib/api/errors";
import { useFavoriteDancer } from "@/shared/engagement/api/mutations";
import { US_STATES } from "@/utils/constants/states";
import { Link } from "@tanstack/react-router";
import { GraduationCapIcon, MapPinIcon, TargetIcon } from "lucide-react";
import { useState } from "react";

export function RecommendedDancer({
  dancer,
}: {
  dancer: RecommendedDancerType;
}) {
  const { mutate } = useFavoriteDancer(dancer.id);
  const [favorited, setFavorited] = useState(false);
  const [retryAfter, startCountdown] = useCountdown();

  const handleFavorite = () => {
    mutate(
      { params: { path: { id: dancer.id } } },
      {
        onSuccess: () => setFavorited(true),
        onError: handleApiError({
          onRateLimit: (retryAfter) => {
            startCountdown(retryAfter);
          },
        }),
      },
    );
  };

  return (
    <div className="hover:bg-accent px-5 py-4">
      <div className="flex items-start gap-3">
        <Avatar className="size-12 self-start rounded-xl">
          <AvatarImage src={dancer.avatar ?? undefined} />
          <AvatarFallback>{dancer.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            className="hover:text-brand truncate text-sm leading-none font-semibold hover:underline"
            to="/$username"
            params={{
              username: dancer.username,
            }}
          >
            {dancer.name}
          </Link>
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <MapPinIcon className="text-brand size-3" />{" "}
            {US_STATES[dancer.location as keyof typeof US_STATES]}
          </p>
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <TargetIcon className="text-brand size-3" /> {dancer.gpa ?? "—"}{" "}
              GPA
            </span>
            {dancer.gradYear ? (
              <span className="flex items-center gap-1">
                <GraduationCapIcon className="text-brand size-3" />{" "}
                {dancer.gradYear}
              </span>
            ) : null}
          </div>
        </div>
        <Button
          className="ml-auto"
          size="xs"
          variant="outline"
          onClick={handleFavorite}
          disabled={favorited || !!retryAfter}
        >
          {retryAfter
            ? `Retry in ${retryAfter}s`
            : favorited
              ? "Favorited"
              : "Favorite"}
        </Button>
      </div>
    </div>
  );
}
