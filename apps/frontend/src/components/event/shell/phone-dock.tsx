import { useRender } from "@base-ui/react/use-render";
import {
  DotsThreeIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import type * as React from "react";

import { Icon } from "@/components/event/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
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
  /** Destinations that do not fit in the dock. A last "More" item opens them in a menu. */
  more?: PhoneDockItem[];
};

/**
 * The phone navigation (≤800px): a floating glass dock 12px from the edges. The current
 * item grows to 2.6× and reveals its label. The shell leaves 84px of bottom padding for it.
 */
function PhoneDock({ items, more, className, ...props }: PhoneDockProps) {
  return (
    <nav aria-label="Event" className={cn("s2s-dock", className)} {...props}>
      {items.map((item) => (
        <DockItem key={item.id} item={item} />
      ))}
      {more && more.length > 0 && <DockMore items={more} />}
    </nav>
  );
}

function DockMore({ items }: { items: PhoneDockItem[] }) {
  const current = items.some((item) => item.current);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="s2s-dock-item s2s-focus"
        aria-label="More pages"
        data-current={current ? "" : undefined}
      >
        <span className="s2s-dock-icon">
          <Icon icon={DotsThreeIcon} size="lg" />
        </span>
        <span className="s2s-dock-label" aria-hidden="true">
          <span>More</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="top"
        sideOffset={12}
        className="min-w-48"
      >
        {items.map((item) => (
          <DropdownMenuItem
            key={item.id}
            render={menuItemRender(item)}
            aria-current={item.current ? "page" : undefined}
            onClick={item.onClick}
          >
            <Icon icon={item.icon} size="md" />
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function menuItemRender(item: PhoneDockItem) {
  const { render } = item;
  if (typeof render === "function") {
    return (props: React.HTMLAttributes<HTMLElement>) => render(props, {});
  }
  return render ?? <a href={item.href} />;
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
