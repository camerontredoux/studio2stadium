import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { XIcon } from "@phosphor-icons/react";
import type * as React from "react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import {
  DialogBackdrop as UiDialogBackdrop,
  DialogClose as UiDialogClose,
  DialogCreateHandle as UiDialogCreateHandle,
  DialogDescription as UiDialogDescription,
  Dialog as UiDialog,
  DialogPortal as UiDialogPortal,
  DialogTitle as UiDialogTitle,
  DialogTrigger as UiDialogTrigger,
  DialogViewport as UiDialogViewport,
} from "@/components/ui/dialog";
import { cn } from "@/components/utils/cn";

type DialogProps = React.ComponentProps<typeof UiDialog>;
type DialogTriggerProps = React.ComponentProps<typeof UiDialogTrigger>;
type DialogCloseProps = React.ComponentProps<typeof UiDialogClose>;

/** The dialog root (components/ui/dialog). Controls open state. */
const Dialog = UiDialog;
/** Opens the dialog; pass `render={<Button />}` for an S2S button. */
const DialogTrigger = UiDialogTrigger;
/** Closes the dialog; pass `render={<Button variant="ghost" size="lg" />}` for "Cancel". */
const DialogClose = UiDialogClose;
/** Creates a handle for opening a dialog from a detached trigger. */
const DialogCreateHandle = UiDialogCreateHandle;

type DialogPopupProps = DialogPrimitive.Popup.Props & {
  /** Show a ghost close button in the top-right corner. Off by default, as in the design. */
  showCloseButton?: boolean;
};

/**
 * The S2S dialog box: centred on the scrim, at most 420px wide, surface-head
 * body with a line-control border, 12px radius and the dialog shadow.
 */
function DialogPopup({
  className,
  children,
  showCloseButton = false,
  ...props
}: DialogPopupProps) {
  return (
    <UiDialogPortal>
      <UiDialogBackdrop className="bg-scrim backdrop-blur-none" />
      <UiDialogViewport className="grid-rows-[1fr_auto_1fr] p-(--space-16)">
        <DialogPrimitive.Popup
          className={cn(
            "bg-surface-head text-fg relative row-start-2 flex max-h-full min-h-0 w-full max-w-[420px] min-w-0 flex-col overflow-hidden font-sans outline-none",
            "border-line-control rounded-(--radius-12) border shadow-(--shadow-dialog)",
            "-translate-y-[calc(1.25rem*var(--nested-dialogs))] scale-[calc(1-0.1*var(--nested-dialogs))] opacity-[calc(1-0.1*var(--nested-dialogs))] transition-[scale,opacity,translate] duration-200 ease-in-out will-change-transform",
            "data-ending-style:scale-98 data-ending-style:opacity-0 data-nested:data-ending-style:translate-y-8 data-nested-dialog-open:origin-top data-starting-style:scale-98 data-starting-style:opacity-0 data-nested:data-starting-style:translate-y-8",
            className,
          )}
          data-slot="dialog-popup"
          {...props}
        >
          {children}
          {showCloseButton && (
            <UiDialogClose
              className="absolute top-(--space-12) right-(--space-12)"
              render={
                <Button variant="ghost" size="sm" iconOnly label="Close" />
              }
            >
              <Icon icon={XIcon} />
            </UiDialogClose>
          )}
        </DialogPrimitive.Popup>
      </UiDialogViewport>
    </UiDialogPortal>
  );
}

type DialogHeaderProps = React.ComponentProps<"div">;

/** Holds the title (and an optional description) above the body. */
function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-(--space-4) px-(--space-16) pt-(--space-16)",
        className,
      )}
      data-slot="dialog-header"
      {...props}
    />
  );
}

type DialogTitleProps = React.ComponentProps<typeof UiDialogTitle>;

/** The 15px semibold dialog title. */
function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <UiDialogTitle
      className={cn(
        "type-title text-fg m-0 font-sans text-[15px] leading-[1.4] font-semibold",
        className,
      )}
      {...props}
    />
  );
}

type DialogDescriptionProps = React.ComponentProps<typeof UiDialogDescription>;

/** A short line under the title. */
function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return (
    <UiDialogDescription
      className={cn("type-body text-fg-2 text-[13px] leading-[1.4]", className)}
      {...props}
    />
  );
}

type DialogBodyProps = React.ComponentProps<"div">;

/** The dialog body: fields stacked 14px apart, 16px padding, scrolls when tall. */
function DialogBody({ className, ...props }: DialogBodyProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col gap-(--space-14) overflow-y-auto p-(--space-16)",
        className,
      )}
      data-slot="dialog-body"
      {...props}
    />
  );
}

type DialogFooterProps = React.ComponentProps<"div">;

/**
 * The footer on `surface` under a `line` rule. Put a ghost "Cancel" then one
 * primary verb in it, both `size="lg"` (32px).
 */
function DialogFooter({ className, ...props }: DialogFooterProps) {
  return (
    <div
      className={cn(
        "border-line bg-surface flex shrink-0 items-center justify-end gap-(--space-8) border-t px-(--space-16) py-(--space-12)",
        className,
      )}
      data-slot="dialog-footer"
      {...props}
    />
  );
}

type DialogReadoutProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** A 14px Phosphor icon shown in fg-3 before the value. */
  icon?: PhosphorIcon;
  /** The fixed value, shown in mono and truncated. */
  children: React.ReactNode;
  /** A short mono note after the value, e.g. a time or an email. Truncated when long. */
  note?: React.ReactNode;
};

/** A fixed, read-only value inside the body (icon, mono value, mono note). */
function DialogReadout({
  icon,
  note,
  children,
  className,
  ...props
}: DialogReadoutProps) {
  return (
    <div
      className={cn(
        "border-line bg-bg-300 flex h-(--control-lg) items-center gap-(--space-8) rounded-(--radius-6) border px-(--space-10)",
        className,
      )}
      data-slot="dialog-readout"
      {...props}
    >
      {icon && <Icon icon={icon} className="text-fg-3" />}
      <span className="text-fg min-w-0 flex-1 truncate font-mono text-[12.5px] leading-[1.4] tabular-nums">
        {children}
      </span>
      {note != null && (
        <span className="text-fg-3 max-w-[60%] min-w-0 shrink truncate font-mono text-[11px] leading-[1.4] tabular-nums">
          {note}
        </span>
      )}
    </div>
  );
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogPopup as DialogContent,
  DialogCreateHandle,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogReadout,
  DialogTitle,
  DialogTrigger,
};
export type {
  DialogBodyProps,
  DialogCloseProps,
  DialogPopupProps as DialogContentProps,
  DialogDescriptionProps,
  DialogFooterProps,
  DialogHeaderProps,
  DialogPopupProps,
  DialogProps,
  DialogReadoutProps,
  DialogTitleProps,
  DialogTriggerProps,
};
