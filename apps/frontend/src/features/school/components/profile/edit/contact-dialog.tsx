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
import { ContactForm, type ContactFormData } from "./contact-form";

export function ContactDialog({ username }: { username: string }) {
  const [open, setOpen] = React.useState(false);
  const { mutate, isPending } = useUpdateProgram(username);

  const handleSubmit = (data: ContactFormData) => {
    mutate(
      { body: data },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Contact information updated",
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
          <DialogTitle>Edit Contact Information</DialogTitle>
          <DialogDescription>
            Update your social media links and contact details.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <ContactForm username={username} onSubmit={handleSubmit} />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button type="submit" form="edit-contact-form" disabled={isPending}>
            {isPending ? <Spinner label="Saving..." /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
