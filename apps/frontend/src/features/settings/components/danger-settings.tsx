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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { useDeleteAccount } from "../api/mutations";

const CONFIRM_TEXT = "delete";

export function DangerSettings() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [feedback, setFeedback] = useState("");

  const { mutate, isPending } = useDeleteAccount();

  const isConfirmed = confirmText.toLowerCase() === CONFIRM_TEXT;

  const handleDelete = () => {
    mutate(
      {
        body: {
          feedback: feedback.trim() || undefined,
        },
      } as any,
      {
        onSuccess: () => {
          window.location.href = "/login";
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

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setConfirmText("");
      setFeedback("");
    }
  };

  return (
    <div className="flex flex-col gap-4 px-2 lg:gap-6">
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-4">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold">Danger Zone</h2>
          <p className="text-muted-foreground text-xs">
            Irreversible and destructive actions.
          </p>
        </div>
        <div className="flex max-w-md flex-col gap-4">
          <div className="border-destructive/50 bg-destructive/5 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <TriangleAlertIcon className="text-destructive mt-0.5 size-5 shrink-0" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Delete Account</p>
                <p className="text-muted-foreground text-xs">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <AlertDialog open={open} onOpenChange={handleOpenChange}>
                <AlertDialogTrigger
                  render={<Button variant="destructive" size="sm" />}
                >
                  Delete Account
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex flex-col gap-3 px-6 pb-4">
                    <Field name="feedback">
                      <FieldLabel>Feedback (optional)</FieldLabel>
                      <Textarea
                        placeholder="Tell us why you are deleting your account..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        maxLength={1000}
                      />
                    </Field>
                    <Field name="confirm">
                      <FieldLabel>
                        Type <span className="font-mono font-bold">delete</span>{" "}
                        to confirm
                      </FieldLabel>
                      <Input
                        placeholder="delete"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        autoComplete="off"
                      />
                    </Field>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogClose
                      render={<Button variant="outline" disabled={isPending} />}
                    >
                      Cancel
                    </AlertDialogClose>
                    <Button
                      variant="destructive"
                      disabled={!isConfirmed || isPending}
                      onClick={handleDelete}
                    >
                      {isPending ? (
                        <Spinner label="Deleting..." />
                      ) : (
                        "Delete Account"
                      )}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
