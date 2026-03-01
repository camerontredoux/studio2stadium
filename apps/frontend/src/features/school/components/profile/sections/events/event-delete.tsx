import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { useDeleteEvent } from "@/features/school/api/mutations";

interface EventDeleteProps {
  eventId: string;
  username: string;
  onDeleted?: () => void;
}

export function EventDelete({
  eventId,
  username,
  onDeleted,
}: EventDeleteProps) {
  const { mutate, isPending } = useDeleteEvent(username);

  const handleDelete = () => {
    mutate(
      { params: { path: { id: eventId } } },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Event deleted",
            type: "success",
          });
          onDeleted?.();
        },
      },
    );
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="destructive-outline" className="mr-auto" />}
      >
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Event</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this event? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" />}>
            Cancel
          </AlertDialogClose>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? <Spinner label="Deleting..." /> : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
