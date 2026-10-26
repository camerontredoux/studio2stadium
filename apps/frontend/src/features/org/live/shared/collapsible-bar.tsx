import { CaretRightIcon } from "@phosphor-icons/react";
import { useId, type ReactNode } from "react";

import { Icon } from "@/components/event/icon";
import { Label } from "@/components/event/label";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export type CollapsibleBarProps = {
  /** The sentence-case mono label after the caret. */
  label: ReactNode;
  /** One line after the label; truncates. */
  summary?: ReactNode;
  /** Shown at the right end of the bar, e.g. an error count. */
  aside?: ReactNode;
  /** The contents shown when the bar is open. */
  children: ReactNode;
};

/**
 * A rail's contents folded into one full-width row: caret, label and a
 * one-line summary. Clicking it opens the contents in place below. Closed by
 * default. Render it inside a `Panel`, shown where the rail is hidden
 * (`hidden bp-rail:flex`).
 */
export function CollapsibleBar({
  label,
  summary,
  aside,
  children,
}: CollapsibleBarProps) {
  const panelId = useId();
  return (
    <Collapsible>
      {/* The panel stays mounted, so the trigger can always point at it. */}
      <CollapsibleTrigger
        aria-controls={panelId}
        className="group s2s-focus text-fg hover:bg-surface-hover flex min-h-(--row) w-full items-center gap-(--space-10) border-0 bg-transparent px-(--space-14) text-left focus-visible:-outline-offset-2"
      >
        <Icon
          icon={CaretRightIcon}
          className="text-fg-3 group-data-panel-open:text-fg shrink-0 transition-transform duration-150 group-data-panel-open:rotate-90"
        />
        <Label className="shrink-0">{label}</Label>
        <span className="type-data-sm text-fg-2 min-w-0 flex-1 truncate">
          {summary}
        </span>
        {aside}
      </CollapsibleTrigger>
      <CollapsiblePanel id={panelId} keepMounted>
        {children}
      </CollapsiblePanel>
    </Collapsible>
  );
}
