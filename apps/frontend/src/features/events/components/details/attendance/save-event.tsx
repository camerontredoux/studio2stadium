import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { SaveIcon } from "lucide-react";
import { useSaveEvent } from "../../../api/mutations";

export function SaveEvent({
  eventId,
  size = "xs",
}: {
  eventId: string;
  size?: "xs" | "sm";
}) {
  const { mutate, isPending } = useSaveEvent(eventId);

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
      onClick={handleSubmit}
    >
      {isPending ? <Spinner /> : <SaveIcon />} Save
    </Button>
  );
}
