import { useId, useState } from "react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogPopup>
        {/* Content unmounts while closed, so the confirmation checkbox starts
            unchecked on every open. */}
        <ResetCheckInDialogContent {...rest} />
      </AlertDialogPopup>
    </AlertDialog>
  );
}

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
  const confirmId = useId();

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Reset check-in</AlertDialogTitle>
        <AlertDialogDescription>
          This will clear check-in for all {checkedInCount.toLocaleString()}{" "}
          checked-in dancers in {eventName}. They will need to check in again.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="flex items-start gap-2 px-6">
        <Checkbox
          id={confirmId}
          checked={confirmed}
          onCheckedChange={(checked) => setConfirmed(!!checked)}
        />
        <label
          htmlFor={confirmId}
          className="text-muted-foreground cursor-pointer text-sm leading-tight select-none"
        >
          I understand this will clear all check-in records for this event.
        </label>
      </div>

      <AlertDialogFooter variant="bare">
        <AlertDialogClose render={<Button variant="ghost" />}>
          Cancel
        </AlertDialogClose>
        <Button
          variant="destructive"
          disabled={!confirmed || isPending}
          onClick={onConfirm}
        >
          {isPending ? "Resetting…" : "Reset check-in"}
        </Button>
      </AlertDialogFooter>
    </>
  );
}
