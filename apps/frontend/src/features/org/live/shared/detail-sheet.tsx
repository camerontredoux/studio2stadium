import { XIcon } from "@phosphor-icons/react";
import { useEffect, useId, useState } from "react";
import type * as React from "react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { Label } from "@/components/event/label";
import { Sheet, SheetPopup, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/components/utils/cn";

// The S2S side sheet, as designed for the admin roster detail sheet: a 440px
// card inset 8px from the viewport edge (full width less the inset on phones),
// a summary header, grouped sections of label/value rows, and a sticky footer.

/**
 * Base UI skips the enter animation when a sheet mounts already open, so this
 * stays false for the first frame after mount and the first open animates.
 */
function useNextFrame() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready) return;
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, [ready]);
  return ready;
}

type DetailSheetProps = Omit<
  React.ComponentProps<typeof SheetPopup>,
  "side" | "showCloseButton" | "variant"
> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** The sheet root and its popup. Children: a header, a scrolling body, a footer. */
function DetailSheet({
  open,
  onOpenChange,
  className,
  children,
  ...props
}: DetailSheetProps) {
  const ready = useNextFrame();
  return (
    <Sheet open={open && ready} onOpenChange={onOpenChange}>
      <SheetPopup
        showCloseButton={false}
        side="right"
        className={cn(
          "bg-surface text-fg m-(--space-8) font-sans not-dark:bg-clip-border",
          "mobile:w-[calc(100%-16px)] desktop:w-[calc(100%-16px)] bp-phone:max-w-none w-[calc(100%-16px)] max-w-[440px]",
          "border-line overflow-hidden rounded-(--radius-16) border shadow-(--shadow-dialog) before:hidden",
          className,
        )}
        {...props}
      >
        {children}
      </SheetPopup>
    </Sheet>
  );
}

/** The 56px tile in the header: a bib, initials or an icon on `fg`. */
function DetailSheetTile({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const long = typeof children === "string" && children.length > 3;
  return (
    <div
      className={cn(
        "bg-fg text-on-fg grid size-14 shrink-0 place-items-center rounded-(--radius-10) font-mono font-medium tracking-[-0.02em] tabular-nums",
        long ? "text-[18px]" : "text-[24px]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type DetailSheetHeaderProps = {
  /** Usually a `DetailSheetTile`. */
  tile?: React.ReactNode;
  title: React.ReactNode;
  /** The mono line under the title. */
  meta?: React.ReactNode;
  /** Let the meta line wrap instead of truncating. */
  wrapMeta?: boolean;
  onClose: () => void;
  className?: string;
};

/** Tile, title, a meta line and the close button, over a soft rule. */
function DetailSheetHeader({
  tile,
  title,
  meta,
  wrapMeta = false,
  onClose,
  className,
}: DetailSheetHeaderProps) {
  return (
    <header
      className={cn(
        "border-line-soft flex shrink-0 items-start gap-(--space-14) border-b p-(--space-16)",
        className,
      )}
    >
      {tile}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-(--space-4)",
          tile && "pt-(--space-6)",
        )}
      >
        <SheetTitle className="text-fg truncate font-sans text-[18px] leading-[1.3] font-semibold">
          {title}
        </SheetTitle>
        {meta != null && meta !== false && (
          <div
            className={cn("type-meta text-fg-3 m-0", !wrapMeta && "truncate")}
          >
            {meta}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        iconOnly
        label="Close"
        onClick={onClose}
        className="-me-(--space-4) -mt-(--space-2)"
      >
        <Icon icon={XIcon} size="md" />
      </Button>
    </header>
  );
}

/** The scrolling middle. Use `DetailSheetForm` instead when it holds a form. */
function DetailSheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain",
        className,
      )}
      {...props}
    />
  );
}

/** The scrolling middle as a form; the footer's submit button points at its `id`. */
function DetailSheetForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form
      noValidate
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain",
        className,
      )}
      {...props}
    />
  );
}

/** A group under a soft rule, headed by a mono label with an optional aside. */
function DetailSheetSection({
  title,
  aside,
  className,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "border-line-soft flex flex-col gap-(--space-14) border-t px-(--space-16) pt-(--space-16) pb-(--space-20) first:border-t-0",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-(--space-8)">
        <Label id={id} render={<h3 />} className="m-0">
          {title}
        </Label>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** The `dl` that holds `DetailSheetRow`s, 12px apart. */
function DetailSheetRows({ className, ...props }: React.ComponentProps<"dl">) {
  return (
    <dl
      className={cn("m-0 flex flex-col gap-(--space-12)", className)}
      {...props}
    />
  );
}

/** One term and value on a 100px label column. */
function DetailSheetRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-(--control) grid-cols-[100px_minmax(0,1fr)] items-center gap-(--space-8)">
      <dt className="type-body text-fg-2">{label}</dt>
      <dd className="m-0 flex min-w-0 items-center gap-(--space-8)">
        {children}
      </dd>
    </div>
  );
}

/** A read-only value, or `empty` ("Not set") in fg-3. */
function DetailSheetValue({
  value,
  mono = false,
  empty = "Not set",
}: {
  value: string | number | null | undefined;
  mono?: boolean;
  empty?: string;
}) {
  if (value == null || value === "") {
    return <span className="type-body text-fg-3">{empty}</span>;
  }
  return (
    <span className={cn("text-fg truncate", mono ? "type-data" : "type-body")}>
      {value}
    </span>
  );
}

/** The sticky footer: a danger action on the left, then Cancel and the primary verb. */
function DetailSheetFooter({
  className,
  ...props
}: React.ComponentProps<"footer">) {
  return (
    <footer
      className={cn(
        "border-line-soft bg-surface flex shrink-0 items-center gap-(--space-8) border-t px-(--space-16) py-(--space-12)",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The footer's primary verb (32px). While disabled (nothing to save yet) it
 * sits on `surface-pressed` instead of fading out.
 */
function DetailSheetPrimary({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <Button
      variant="primary"
      size="lg"
      className={cn(
        "disabled:border-surface-pressed disabled:bg-surface-pressed disabled:text-fg-2 disabled:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

export {
  DetailSheet,
  DetailSheetBody,
  DetailSheetFooter,
  DetailSheetForm,
  DetailSheetHeader,
  DetailSheetPrimary,
  DetailSheetRow,
  DetailSheetRows,
  DetailSheetSection,
  DetailSheetTile,
  DetailSheetValue,
};
