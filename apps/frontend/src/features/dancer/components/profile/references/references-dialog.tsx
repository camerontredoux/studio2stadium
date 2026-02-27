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
import {
  useCreateReference,
  useUpdateReference,
} from "@/features/dancer/api/mutations";
import type { Reference } from "@/features/dancer/types";
import { PencilIcon, PlusIcon } from "lucide-react";
import * as React from "react";
import { ReferencesForm, type ReferenceFormData } from "./references-form";

interface ReferencesDialogProps {
  username: string;
  reference?: Reference;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ReferencesDialog({
  username,
  reference,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ReferencesDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const isEditMode = !!reference;

  const { mutate: createReference, isPending: isCreating } =
    useCreateReference(username);
  const { mutate: updateReference, isPending: isUpdating } =
    useUpdateReference(username);

  const isPending = isCreating || isUpdating;

  const handleSubmit = (data: ReferenceFormData) => {
    if (isEditMode) {
      updateReference(
        { params: { path: { id: reference.id } }, body: data },
        {
          onSuccess: () => {
            toastManager.add({
              title: "Success",
              description: "Reference updated",
              type: "success",
            });
            setOpen(false);
          },
        },
      );
    } else {
      createReference(
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
    }
  };

  const defaultValues = reference
    ? {
        name: reference.name,
        title: reference.title,
        description: reference.description ?? "",
      }
    : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger render={<Button size="icon-xs" variant="ghost" />}>
          {isEditMode ? <PencilIcon /> : <PlusIcon />}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Reference" : "Add Reference"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update this reference's information."
              : "Add a coach, mentor, or other professional reference."}
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <ReferencesForm
            key={reference?.id ?? "new"}
            onSubmit={handleSubmit}
            defaultValues={defaultValues}
            formId="reference-form"
          />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button type="submit" form="reference-form" disabled={isPending}>
            {isPending ? (
              <Spinner label={isEditMode ? "Saving..." : "Adding..."} />
            ) : isEditMode ? (
              "Save"
            ) : (
              "Add"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
