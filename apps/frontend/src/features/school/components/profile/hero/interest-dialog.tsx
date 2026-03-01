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
import { useShowInterest } from "@/features/school/api/mutations";
import { handleApiError } from "@/lib/api/errors";
import { HeartIcon } from "lucide-react";
import { useState } from "react";

export function ShowInterestDialog({
  schoolId,
  count,
}: {
  schoolId: string;
  count: number;
}) {
  const { mutate: showInterest, isPending } = useShowInterest(schoolId);
  const [open, setOpen] = useState(false);

  const handleShowInterest = () => {
    showInterest(
      { params: { path: { id: schoolId } } },
      {
        onSuccess: () => {
          setOpen(false);
        },
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
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button variant="outline" size="sm" className="flex-1" />}
      >
        <HeartIcon /> Show Interest ({count}/3)
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Show Interest</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to show interest in this school? You can only
            show interest three times, and this alerts the school with a
            notification. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>
            Cancel
          </AlertDialogClose>
          <Button onClick={handleShowInterest} disabled={isPending}>
            {isPending ? <Spinner label="Notifying..." /> : "Show Interest"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
