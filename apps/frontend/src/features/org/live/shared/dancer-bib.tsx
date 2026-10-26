import { useLocation } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/event/button";
import { ChipSub } from "@/components/event/chip";
import { cn } from "@/components/utils/cn";

import { DancerDialog } from "./dancer-dialog";
import {
  useDancerDialog,
  type DancerDialogDancer,
  type DancerDialogOpenOptions,
  type DancerDialogViewer,
} from "./dancer-dialog-context";

export interface DancerBibProps extends DancerDialogOpenOptions {
  /** The dancer the bib belongs to; at least `rosterId`, bib and name. */
  dancer: DancerDialogDancer;
  /**
   * `text` (default): the bib alone in 13px mono, for table cells and rows.
   * `chip`: a small secondary Button with the bib as its mono prefix and the name as its label.
   */
  variant?: "text" | "chip";
  /** Replaces the default content (the bib, or bib + name for chips). */
  children?: ReactNode;
  /** Only used outside a `DancerDialogProvider`; defaults from the URL (`/coach/` → coach). */
  viewer?: DancerDialogViewer;
  className?: string;
}

function dancerName(dancer: DancerDialogDancer) {
  return `${dancer.firstName ?? ""} ${dancer.lastName ?? ""}`.trim();
}

/**
 * A dancer's bib as a button that opens the dancer dialog. Uses the area's
 * `DancerDialogProvider` when there is one, else keeps its own dialog.
 */
export function DancerBib({
  dancer,
  variant = "text",
  children,
  viewer,
  onViewProfile,
  className,
}: DancerBibProps) {
  const shared = useDancerDialog();
  const pathname = useLocation({ select: (location) => location.pathname });
  const [open, setOpen] = useState(false);

  const name = dancerName(dancer);
  const bib = dancer.bibNumber ?? null;
  const ariaLabel =
    bib != null
      ? `Open ${name || "dancer"} (bib ${bib})`
      : `Open ${name || "dancer"}`;

  const handleClick = (event: React.MouseEvent) => {
    // Bibs often sit in clickable rows; the bib is its own target.
    event.stopPropagation();
    if (shared) shared.open(dancer, { onViewProfile });
    else setOpen(true);
  };

  const trigger =
    variant === "chip" ? (
      <Button
        size="sm"
        onClick={handleClick}
        aria-label={ariaLabel}
        className={className}
      >
        {bib != null ? <ChipSub>{bib}</ChipSub> : null}
        {children ?? (name || "[Dancer name]")}
      </Button>
    ) : (
      <button
        type="button"
        onClick={handleClick}
        aria-label={ariaLabel}
        className={cn(
          "text-fg s2s-focus -mx-(--space-4) inline-flex h-(--control-sm) cursor-pointer items-center rounded-(--radius-4) px-(--space-4) font-mono text-[13px] tabular-nums",
          "decoration-fg-3 hover:bg-surface-active underline-offset-4 transition-colors duration-150 hover:underline focus-visible:underline",
          className,
        )}
      >
        {children ?? bib ?? "—"}
      </button>
    );

  return (
    <>
      {trigger}
      {!shared && (
        <DancerDialog
          viewer={viewer ?? (pathname.includes("/coach") ? "coach" : "admin")}
          dancer={dancer}
          open={open}
          onOpenChange={setOpen}
          onViewProfile={onViewProfile}
        />
      )}
    </>
  );
}
