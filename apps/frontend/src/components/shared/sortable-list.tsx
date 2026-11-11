import { Button } from "@/components/ui/button";
import { FrameDescription } from "@/components/ui/frame";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@/components/ui/sortable";
import { cn } from "@/components/utils/cn";
import { GripVerticalIcon } from "lucide-react";
import { Fragment, type ReactNode } from "react";

interface SortableListProps<T> {
  items: T[];
  getId: (item: T) => string;
  /** Names an item for the drag handle's label, e.g. "Reorder Jazz Award". */
  getLabel: (item: T) => string;
  /** Without it the list renders as a plain list with no handles. */
  onReorder?: (items: T[]) => void;
  /** `grid` lets items move in two dimensions. */
  layout?: "list" | "grid";
  className?: string;
  /** Renders an item; place `handle` wherever the item's grip belongs. */
  children: (item: T, handle: ReactNode) => ReactNode;
}

/**
 * A list its owner can reorder by dragging each item's grip, with the mouse,
 * touch, or the keyboard (focus the grip, Space to lift, arrows, Space to drop).
 */
export function SortableList<T>({
  items,
  getId,
  getLabel,
  onReorder,
  layout = "list",
  className,
  children,
}: SortableListProps<T>) {
  if (!onReorder || items.length < 2) {
    return (
      <div className={className}>
        {items.map((item) => (
          <Fragment key={getId(item)}>{children(item, null)}</Fragment>
        ))}
      </div>
    );
  }

  const byId = new Map(items.map((item) => [getId(item), item]));
  const find = (id: unknown) => byId.get(String(id));

  return (
    <Sortable
      value={[...byId.keys()]}
      onValueChange={(ids) => onReorder(ids.map((id) => byId.get(id)!))}
      orientation={layout === "grid" ? "mixed" : "vertical"}
    >
      <SortableContent className={className}>
        {items.map((item) => (
          <SortableItem
            key={getId(item)}
            value={getId(item)}
            className="data-dragging:opacity-40"
          >
            {children(item, <ReorderHandle label={getLabel(item)} />)}
          </SortableItem>
        ))}
      </SortableContent>
      <SortableOverlay>
        {({ value }) => {
          const item = find(value);
          if (!item) return null;
          return (
            <SortableItem
              value={getId(item)}
              className={cn(
                "bg-background ring-brand/40 shadow-lg ring-1",
                layout === "grid" ? "rounded-lg" : "rounded-xl",
              )}
            >
              {children(item, <ReorderHandle label={getLabel(item)} />)}
            </SortableItem>
          );
        }}
      </SortableOverlay>
    </Sortable>
  );
}

function ReorderHandle({ label }: { label: string }) {
  return (
    <SortableItemHandle asChild>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`Reorder ${label}`}
        title="Drag to reorder"
        className="text-muted-foreground hover:text-foreground"
      >
        <GripVerticalIcon />
      </Button>
    </SortableItemHandle>
  );
}

/**
 * Tells an owner the section can be reordered. Shown until they first reorder
 * it (no item has a saved position yet), and only when there is something to
 * reorder.
 */
export function ReorderHint({
  items,
  children = "Drag to change the order",
}: {
  items: { position?: number | null }[];
  children?: ReactNode;
}) {
  if (items.length < 2 || items.some((item) => item.position != null)) {
    return null;
  }

  return (
    <FrameDescription className="mt-0.5 flex items-center gap-1 text-xs font-normal">
      <GripVerticalIcon aria-hidden className="size-3.5" />
      {children}
    </FrameDescription>
  );
}
