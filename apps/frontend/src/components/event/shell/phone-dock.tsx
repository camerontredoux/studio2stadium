import { useRender } from "@base-ui/react/use-render";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import type * as React from "react";

import { Icon } from "@/components/event/icon";
import { cn } from "@/components/utils/cn";

type PhoneDockItem = {
  id: string;
  label: string;
  /** A Phosphor icon component, shown at 20px. */
  icon: PhosphorIcon;
  /** The current page: widens into a labelled pill. */
  current?: boolean;
  /** The link element, e.g. `<Link to=… />`. Defaults to `<a href>`. */
  render?: useRender.RenderProp;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
};

type PhoneDockProps = Omit<React.ComponentProps<"nav">, "children"> & {
  /** Five at most: the same destinations as the sidebar. */
  items: PhoneDockItem[];
};

/**
 * The phone navigation (≤800px): a floating glass dock 12px from the edges. The current
 * item grows to 2.6× and reveals its label. The shell leaves 84px of bottom padding for it.
 */
function PhoneDock({ items, className, ...props }: PhoneDockProps) {
  return (
    <nav aria-label="Event" className={cn("s2s-dock", className)} {...props}>
      {items.map((item) => (
        <DockItem key={item.id} item={item} />
      ))}
    </nav>
  );
}

function DockItem({ item }: { item: PhoneDockItem }) {
  return useRender({
    defaultTagName: "a",
    render: item.render,
    props: {
      className: "s2s-dock-item s2s-focus",
      href: item.href,
      onClick: item.onClick,
      "aria-label": item.label,
      "aria-current": item.current ? "page" : undefined,
      "data-current": item.current ? "" : undefined,
      children: (
        <>
          <span className="s2s-dock-icon">
            <Icon icon={item.icon} size="lg" />
          </span>
          <span className="s2s-dock-label" aria-hidden="true">
            <span>{item.label}</span>
          </span>
        </>
      ),
    },
  });
}

export { PhoneDock };
export type { PhoneDockItem, PhoneDockProps };
