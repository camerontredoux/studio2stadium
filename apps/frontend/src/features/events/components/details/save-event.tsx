import { useCountdown } from "@/components/hooks/use-countdown";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { CheckIcon, SaveIcon } from "lucide-react";
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
  const { mutate: save } = useSaveEvent(id);
  const { mutate: unsave } = useUnsaveEvent(id);

  const [retryAfter, startCountdown] = useCountdown();

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
      variant={isSaved ? "destructive-outline" : "default"}
      disabled={!!retryAfter}
      size={size}
      onClick={handleClick}
      className="flex-1 gap-1.5"
    >
      {retryAfter ? (
        `Retry in ${retryAfter}s`
      ) : isSaved ? (
        <>
          <CheckIcon /> Saved
        </>
      ) : (
        <>
          <SaveIcon /> Save
        </>
      )}
    </Button>
  );
}
