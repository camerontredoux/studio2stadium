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
import { TeamForm, type TeamFormData } from "./team-form";

export function TeamDialog({ username }: { username: string }) {
  const [open, setOpen] = React.useState(false);
  const { mutate, isPending } = useUpdateProgram(username);

  const handleSubmit = (data: TeamFormData) => {
    mutate(
      { body: data },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Team information updated",
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
          <DialogTitle>Edit Team Information</DialogTitle>
          <DialogDescription>
            Update your team details and coaching staff.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <TeamForm username={username} onSubmit={handleSubmit} />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button type="submit" form="edit-team-form" disabled={isPending}>
            {isPending ? <Spinner label="Saving..." /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
