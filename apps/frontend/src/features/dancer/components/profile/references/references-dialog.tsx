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
import { useCreateReference } from "@/features/dancer/api/mutations";
import { PlusIcon } from "lucide-react";
import * as React from "react";
import { ReferencesForm, type ReferenceFormData } from "./references-form";

export function ReferencesDialog({ username }: { username: string }) {
  const [open, setOpen] = React.useState(false);
  const { mutate, isPending } = useCreateReference(username);

  const handleSubmit = (data: ReferenceFormData) => {
    mutate(
      { body: data },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Reference added",
            type: "success",
          });
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="icon-xs" variant="ghost" />}>
        <PlusIcon />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Reference</DialogTitle>
          <DialogDescription>
            Add a coach, mentor, or other professional reference.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <ReferencesForm onSubmit={handleSubmit} />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button
            type="submit"
            form="create-reference-form"
            disabled={isPending}
          >
            {isPending ? <Spinner label="Adding..." /> : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
