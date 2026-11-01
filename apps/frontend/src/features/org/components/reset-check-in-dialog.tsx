import { useState } from "react";

import { Button } from "@/components/event/button";
import { Checkbox } from "@/components/event/checkbox";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/event/dialog";

export interface ResetCheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventName: string;
  checkedInCount: number;
  isPending?: boolean;
  onConfirm: () => void;
}

export function ResetCheckInDialog({
  open,
  onOpenChange,
  ...rest
}: ResetCheckInDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup role="alertdialog">
        {/* Content unmounts while closed, so the confirmation checkbox starts
            unchecked on every open. */}
        <ResetCheckInDialogContent {...rest} />
      </DialogPopup>
    </Dialog>
  );
}

const CONFIRM_LABEL =
  "I understand this will clear all check-in records for this event.";

type ResetCheckInDialogContentProps = Omit<
  ResetCheckInDialogProps,
  "open" | "onOpenChange"
>;

function ResetCheckInDialogContent({
  eventName,
  checkedInCount,
  isPending = false,
  onConfirm,
}: ResetCheckInDialogContentProps) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Reset check-in?</DialogTitle>
        <DialogDescription>
          This will clear check-in for all {checkedInCount.toLocaleString()}{" "}
          checked-in dancers in {eventName}. They will need to check in again.
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        <Checkbox
          label={CONFIRM_LABEL}
          // Base UI's checkbox is a span, so the wrapping label doesn't name it.
          aria-label={CONFIRM_LABEL}
          checked={confirmed}
          onCheckedChange={(checked) => setConfirmed(!!checked)}
          className="text-fg-2 items-start [&>*:first-child]:mt-[3px]"
        />
      </DialogBody>

      <DialogFooter>
        <DialogClose render={<Button variant="ghost" size="lg" />}>
          Cancel
        </DialogClose>
        <Button
          variant="danger"
          size="lg"
          disabled={!confirmed || isPending}
          onClick={onConfirm}
          className="border-danger/40 hover:border-danger"
        >
          {isPending ? "Resetting…" : "Reset check-in"}
        </Button>
      </DialogFooter>
    </>
  );
}
