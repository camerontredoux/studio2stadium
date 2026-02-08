import type * as React from "react";

import { cn } from "@/components/utils/cn";

function Frame({
  className,
  compact = false,
  ...props
}: React.ComponentProps<"div"> & { compact?: boolean }) {
  return (
    <div
      className={cn(
        "bg-muted/72 relative flex flex-col rounded-2xl",
        compact ? "border p-0" : "p-1",
        "*:[[data-slot=frame-panel]+[data-slot=frame-panel]]:mt-1",
        className,
      )}
      data-slot="frame"
      data-compact={compact || undefined}
      {...props}
    />
  );
}

function FramePanel({
  className,
  side = "bottom",
  ...props
}: React.ComponentProps<"div"> & { side?: "top" | "bottom" | "inset" }) {
  return (
    <div
      className={cn(
        "bg-background relative overflow-clip rounded-2xl bg-clip-padding shadow-xs/5 before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-xl)-1px)] before:shadow-[0_1px_--theme(--color-black/6%)] dark:before:shadow-[0_-1px_--theme(--color-white/6%)]",
        "in-data-compact:border-0 in-data-compact:p-0",
        side === "top"
          ? "in-data-compact:border-b"
          : side === "bottom"
            ? "in-data-compact:border-t"
            : "",
        "not-in-data-compact:border not-in-data-compact:p-3 not-in-data-compact:sm:p-5",
        className,
      )}
      data-slot="frame-panel"
      {...props}
    />
  );
}

function FrameHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      className={cn(
        "flex flex-col px-5 pt-1 pb-2 in-data-compact:pt-2",
        className,
      )}
      data-slot="frame-panel-header"
      {...props}
    />
  );
}

function FrameTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("text-sm font-semibold", className)}
      data-slot="frame-panel-title"
      {...props}
    />
  );
}

function FrameDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="frame-panel-description"
      {...props}
    />
  );
}

function FrameFooter({ className, ...props }: React.ComponentProps<"footer">) {
  return (
    <footer
      className={cn("flex px-5 py-2", className)}
      data-slot="frame-panel-footer"
      {...props}
    />
  );
}

export {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
};
