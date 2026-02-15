import { useCountdown } from "@/components/hooks/use-countdown";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { BookmarkIcon } from "lucide-react";
import { useSaveEvent, useUnsaveEvent } from "../../api/mutations";

export function SaveEventButton({
  id,
  isSaved,
  size = "xs",
}: {
  id: string;
  isSaved: boolean;
  size?: "xs" | "sm";
}) {
  const { mutate: save, isPending: isSavePending } = useSaveEvent(id);
  const { mutate: unsave, isPending: isUnsavePending } = useUnsaveEvent(id);

  const [retryAfter, startCountdown] = useCountdown();

  const isPending = isSavePending || isUnsavePending;

  const handleClick = () => {
    const mutate = isSaved ? unsave : save;
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
      variant={isSaved ? "destructive-outline" : "outline"}
      disabled={isPending || !!retryAfter}
      size={size}
      onClick={handleClick}
    >
      <BookmarkIcon className={isSaved ? "fill-current" : undefined} />
      {retryAfter ? `Retry in ${retryAfter}s` : isSaved ? "Unsave" : "Save"}
    </Button>
  );
}
