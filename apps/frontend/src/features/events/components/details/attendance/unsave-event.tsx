import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { SaveIcon } from "lucide-react";
import { useUnsaveEvent } from "../../../api/mutations";

export function UnsaveEvent({
  eventId,
  size = "xs",
}: {
  eventId: string;
  size?: "xs" | "sm";
}) {
  const { mutate, isPending } = useUnsaveEvent(eventId);

  const handleSubmit = () => {
    mutate(
      { params: { path: { id: eventId } } },
      {
        onError: handleApiError({
          onError: (error) => {
            toastManager.add({
              title: "Error",
              description: error.message,
              type: "error",
            });
          },
        }),
      },
    );
  };

  return (
    <Button
      disabled={isPending}
      size={size}
      className="flex-1 gap-1.5"
      variant="destructive-outline"
      onClick={handleSubmit}
    >
      {isPending ? <Spinner /> : <SaveIcon />} Unsave
    </Button>
  );
}
