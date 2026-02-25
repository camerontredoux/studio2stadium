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
import * as React from "react";
import { ExtraForm, type ExtraFormData } from "./extra-form";

export function ExtraDialog({ username }: { username: string }) {
  const [open, setOpen] = React.useState(false);
  const { mutate, isPending } = useUpdateProfile(username);

  const handleSubmit = (data: ExtraFormData) => {
    mutate(
      { body: data },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Education & training updated",
            type: "success",
          });
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="xs" />}>Edit</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Education & Training</DialogTitle>
          <DialogDescription>
            Update your education and training information.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <ExtraForm username={username} onSubmit={handleSubmit} />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button type="submit" form="edit-extra-form" disabled={isPending}>
            {isPending ? <Spinner label="Saving..." /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
