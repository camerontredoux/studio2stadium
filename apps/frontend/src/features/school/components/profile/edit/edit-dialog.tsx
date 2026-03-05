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
import { useUpdateProgram } from "@/features/school/api/mutations";
import * as React from "react";
import { EditForm, type EditFormData } from "./edit-form";

export function EditDialog({ username }: { username: string }) {
  const [open, setOpen] = React.useState(false);
  const { mutate, isPending } = useUpdateProgram(username);

  const handleSubmit = (data: EditFormData) => {
    mutate(
      { body: data },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "About section updated",
            type: "success",
          });
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="flex-1" size="sm" />}>
        Edit Profile
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit About</DialogTitle>
          <DialogDescription>
            Make changes to your school's about section.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <EditForm username={username} onSubmit={handleSubmit} />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button type="submit" form="edit-about-form" disabled={isPending}>
            {isPending ? <Spinner label="Saving..." /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
