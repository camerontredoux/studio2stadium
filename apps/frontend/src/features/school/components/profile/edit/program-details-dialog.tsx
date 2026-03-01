import { Badge } from "@/components/ui/badge";
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
import {
  ProgramDetailsForm,
  type ProgramDetailsFormData,
} from "./program-details-form";

interface ProgramDetailsDialogProps {
  username: string;
}

export function ProgramDetailsDialog({ username }: ProgramDetailsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { mutate, isPending } = useUpdateProgram(username);

  const handleSubmit = (data: ProgramDetailsFormData) => {
    mutate(
      { body: data },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Program details updated",
            type: "success",
          });
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Badge
            role="button"
            aria-label="Edit program details"
            tabIndex={0}
            className="cursor-pointer px-1"
          />
        }
      >
        Edit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Program Details</DialogTitle>
          <DialogDescription>
            Update program details used for filtering your school.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <ProgramDetailsForm username={username} onSubmit={handleSubmit} />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button
            type="submit"
            form="edit-program-details-form"
            disabled={isPending}
          >
            {isPending ? <Spinner label="Saving..." /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
