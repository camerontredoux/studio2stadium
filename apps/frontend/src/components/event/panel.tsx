import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type * as React from "react";

import { Label } from "@/components/event/label";
import { cn } from "@/components/utils/cn";

type PanelProps = useRender.ComponentProps<"section">;

/**
 * The bordered card every block of content sits in: surface, a line border,
 * radius-10 and shadow-panel. Panels sit space-8 apart; never nest one in another.
 * Renders a `section` unless `render` is given.
 */
function Panel({ className, render, ...props }: PanelProps) {
  return useRender({
    defaultTagName: "section",
    render,
    props: mergeProps<"section">(
      {
        className: cn(
          "bg-surface border-line flex min-w-0 flex-col overflow-hidden rounded-(--radius-10) border shadow-(--shadow-panel)",
          className,
        ),
      },
      props,
    ),
  });
}

type PanelHeadProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** Uppercase mono label (write it in sentence case). */
  label?: React.ReactNode;
  /** A 13px/600 title, used instead of `label`. */
  title?: React.ReactNode;
  /** A mono count after the label, in fg-2. */
  count?: React.ReactNode;
  /** Actions at the right (24px `sm` buttons). */
  actions?: React.ReactNode;
};

/** The 40px panel head: label or title, optional count, then actions at the right. */
function PanelHead({
  label,
  title,
  count,
  actions,
  className,
  children,
  ...props
}: PanelHeadProps) {
  return (
    <div
      className={cn(
        "border-line flex min-h-(--panel-head) shrink-0 items-center gap-(--space-10) border-b pr-(--space-8) pl-(--space-14)",
        className,
      )}
      {...props}
    >
      {label !== undefined && <Label>{label}</Label>}
      {title !== undefined && (
        <span className="text-fg min-w-0 truncate text-[13px] leading-[1.4] font-semibold">
          {title}
        </span>
      )}
      {count !== undefined && (
        <span className="type-data-sm text-fg-2">{count}</span>
      )}
      {children}
      {actions !== undefined && (
        <div className="ml-auto flex shrink-0 items-center gap-(--space-6)">
          {actions}
        </div>
      )}
    </div>
  );
}

type PanelSubHeadProps = React.ComponentProps<"div"> & {
  label?: React.ReactNode;
  actions?: React.ReactNode;
};

/** A 36px sub-section head inside a panel, on surface-head. */
function PanelSubHead({
  label,
  actions,
  className,
  children,
  ...props
}: PanelSubHeadProps) {
  return (
    <div
      className={cn(
        "bg-surface-head border-line flex min-h-9 shrink-0 items-center gap-(--space-10) border-b pr-(--space-8) pl-(--space-14)",
        className,
      )}
      {...props}
    >
      {label !== undefined && <Label>{label}</Label>}
      {children}
      {actions !== undefined && (
        <div className="ml-auto flex shrink-0 items-center gap-(--space-6)">
          {actions}
        </div>
      )}
    </div>
  );
}

/** The 48px strip under a panel head for filters and search. */
function PanelToolbar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "border-line bp-phone:px-(--space-8) box-border flex h-12 shrink-0 items-center gap-(--space-8) border-b px-(--space-10)",
        className,
      )}
      {...props}
    />
  );
}

/** The 16px vertical rule between toolbar groups. */
function PanelSeparator({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      className={cn("bg-line-control h-4 w-px shrink-0", className)}
      {...props}
    />
  );
}

export { Panel, PanelHead, PanelSeparator, PanelSubHead, PanelToolbar };
export type { PanelHeadProps, PanelProps, PanelSubHeadProps };
