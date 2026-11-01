import { useState, type ReactElement, type ReactNode } from "react";

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
import type { OrgEvent } from "@/features/org/api/admin-queries";
import { useActivateEvent } from "@/features/org/hooks/use-activate-event";

/**
 * The "make this the active event" action: a trigger that opens a
 * confirmation, and the confirmation that activates the event.
 */
export function ActivateEventDialog({
  orgSlug,
  event,
  trigger,
  children,
}: {
  orgSlug: string;
  event: Pick<OrgEvent, "id" | "name"> | null;
  /** The element that opens the confirmation, rendered with `children`. */
  trigger: ReactElement;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const activate = useActivateEvent(orgSlug, {
    onSuccess: () => setOpen(false),
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger}>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Make {event?.name} the active event?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Dancers and coaches will see this as the active event. If another
            event is active, it will no longer be shown to them. Admins can
            still view any event from the event switcher.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose
            render={<Button variant="ghost" disabled={activate.isPending} />}
          >
            Cancel
          </AlertDialogClose>
          <Button
            onClick={() => {
              if (event) activate.mutate(event.id);
            }}
            disabled={!event || activate.isPending}
          >
            {activate.isPending ? "Making active…" : "Make active"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
