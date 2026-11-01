import type * as React from "react";

import { Button } from "@/components/event/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/event/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  /** `danger` for removing or discarding. */
  variant?: "primary" | "danger";
  onConfirm: () => void;
  pending?: boolean;
}

/** A two-button S2S confirmation: "Cancel" and one verb. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel = "Cancel",
  confirmLabel,
  variant = "danger",
  onConfirm,
  pending = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup role="alertdialog">
        <DialogHeader className="pb-(--space-16)">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" size="lg" />}>
            {cancelLabel}
          </DialogClose>
          <Button
            variant={variant}
            size="lg"
            onClick={onConfirm}
            disabled={pending}
            className={
              variant === "danger"
                ? "border-danger/40 hover:border-danger"
                : undefined
            }
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
