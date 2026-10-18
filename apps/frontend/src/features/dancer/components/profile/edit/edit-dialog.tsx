import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { useUpdateProfile } from "@/features/dancer/api/mutations";
import { handleApiError } from "@/lib/api/errors";
import { makeBirthday } from "@/utils/birthday";
import * as React from "react";
import { EditForm, type EditFormData } from "./edit-form";

export function EditDialog({ username }: { username: string }) {
  const [open, setOpen] = React.useState(false);
  const { mutate, isPending } = useUpdateProfile(username);

  const handleSubmit = (data: EditFormData) => {
    const birthday = makeBirthday(data.birthday);
    mutate(
      { body: { ...data, birthday } },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Profile updated",
            type: "success",
          });
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
          onValidation: (_, message) => {
            toastManager.add({
              title: "Error",
              description: message,
              type: "error",
            });
          },
        }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="xs" />}>Edit Profile</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your portfolio information here.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <EditForm username={username} onSubmit={handleSubmit} />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button type="submit" form="edit-profile-form" disabled={isPending}>
            {isPending ? <Spinner label="Saving..." /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
