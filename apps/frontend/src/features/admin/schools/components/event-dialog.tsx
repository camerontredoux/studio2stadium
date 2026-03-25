import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { SchoolEventFormData } from "@/features/admin/api/schemas";
import { SchoolEventForm } from "@/features/admin/components/school-event-form";

interface EventDialogProps {
  school: { username: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SchoolEventFormData) => void;
  isPending: boolean;
}

export function EventDialog({
  school,
  onOpenChange,
  onSubmit,
  isPending,
}: EventDialogProps) {
  return (
    <Dialog open={!!school} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Event to {school?.name}</DialogTitle>
        </DialogHeader>
        <DialogPanel>
          <SchoolEventForm onSubmit={onSubmit} formId="school-event-form" />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button type="submit" form="school-event-form" disabled={isPending}>
            {isPending ? <Spinner label="Creating..." /> : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
