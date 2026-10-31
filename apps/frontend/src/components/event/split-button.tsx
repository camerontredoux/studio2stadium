import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { Fragment } from "react";
import type * as React from "react";

import {
  Button,
  type ButtonProps,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import {
  Menu,
  MenuPopup,
  type MenuPopupProps,
  MenuTrigger,
} from "@/components/event/menu";
import { Group, GroupSeparator } from "@/components/ui/group";
import { cn } from "@/components/utils/cn";

type SplitButtonAction = {
  /** Visible label; hidden on phones when the action has an icon. */
  label: string;
  /** A 14px Phosphor icon before the label. */
  icon?: PhosphorIcon;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Accessible name, e.g. "Edit event" for "Edit". Needed when the label hides on phones. */
  ariaLabel?: string;
  /** Render as another element, e.g. `<Link to="…" />`. */
  render?: ButtonProps["render"];
  disabled?: boolean;
};

type SplitButtonProps = Omit<
  React.ComponentProps<typeof Group>,
  "children" | "orientation" | "onClick"
> &
  Partial<SplitButtonAction> & {
    /** Two or more peer actions, split by line-control dividers. Overrides the single-action props. */
    actions?: SplitButtonAction[];
    /** Menu items (`MenuItem` from @/components/event/menu). When given, a caret opens them. */
    children?: React.ReactNode;
    /** Accessible name of the caret. */
    menuLabel?: string;
    /** Controlled menu open state. */
    menuOpen?: boolean;
    onMenuOpenChange?: React.ComponentProps<typeof Menu>["onOpenChange"];
    /** Props for the menu popup (`align`, `className` for width, `density`). */
    menuProps?: Omit<MenuPopupProps, "children">;
    variant?: ButtonVariant;
    size?: ButtonSize;
  };

// Peer actions on phones collapse to square icon buttons.
const phoneSquare: Record<ButtonSize, string> = {
  sm: "bp-phone:w-(--control-sm) bp-phone:px-0",
  md: "bp-phone:w-(--control) bp-phone:px-0",
  lg: "bp-phone:w-(--control-lg) bp-phone:px-0",
};

// The main action next to a caret: tighter end padding, tighter still on phones.
const beforeCaret: Record<ButtonSize, string> = {
  sm: "ps-(--space-8) pe-(--space-4) bp-phone:ps-(--space-6) bp-phone:pe-(--space-2)",
  md: "ps-(--space-10) pe-(--space-6) bp-phone:ps-(--space-8) bp-phone:pe-(--space-4)",
  lg: "ps-(--space-12) pe-(--space-6) bp-phone:ps-(--space-10) bp-phone:pe-(--space-4)",
};

const caretWidth: Record<ButtonSize, string> = {
  sm: "w-5",
  md: "w-6",
  lg: "w-7",
};

/**
 * A joined group of actions in one bordered control (page header). One action
 * plus a caret menu ("Edit" with "Delete event" behind it), or two or more
 * peer actions ("Upload" and "Add"). Built on components/ui/group.
 */
function SplitButton({
  actions,
  label,
  icon,
  onClick,
  ariaLabel,
  render,
  disabled,
  children,
  menuLabel = "More actions",
  menuOpen,
  onMenuOpenChange,
  menuProps,
  variant = "secondary",
  size = "md",
  className,
  ...props
}: SplitButtonProps) {
  const list: SplitButtonAction[] =
    actions ??
    (label != null
      ? [{ label, icon, onClick, ariaLabel, render, disabled }]
      : []);
  const hasMenu = children != null;
  const secondary =
    variant === "secondary" &&
    "hover:bg-surface-pressed data-pressed:bg-surface-pressed data-popup-open:bg-surface-pressed";

  return (
    <Group className={cn("shrink-0", className)} {...props}>
      {list.map((action, index) => (
        <Fragment key={action.label}>
          {index > 0 && !hasMenu && (
            <GroupSeparator className="bg-line-control" />
          )}
          <Button
            variant={variant}
            size={size}
            label={action.ariaLabel ?? (action.icon ? action.label : undefined)}
            onClick={action.onClick}
            render={action.render}
            disabled={action.disabled}
            className={cn(
              secondary,
              action.icon &&
                (hasMenu && list.length === 1
                  ? beforeCaret[size]
                  : phoneSquare[size]),
            )}
          >
            {action.icon && <Icon icon={action.icon} />}
            <span className={cn(action.icon && "bp-phone:hidden")}>
              {action.label}
            </span>
          </Button>
        </Fragment>
      ))}
      {hasMenu && (
        <Menu open={menuOpen} onOpenChange={onMenuOpenChange}>
          <MenuTrigger
            render={
              <Button
                variant={variant}
                size={size}
                label={menuLabel}
                className={cn(
                  "px-0",
                  caretWidth[size],
                  variant === "secondary" &&
                    "text-fg-2 hover:text-fg-strong data-popup-open:text-fg-strong",
                  secondary,
                )}
              />
            }
          >
            <Icon icon={CaretDownIcon} />
          </MenuTrigger>
          <MenuPopup
            align="end"
            {...menuProps}
            className={cn("min-w-[180px]", menuProps?.className)}
          >
            {children}
          </MenuPopup>
        </Menu>
      )}
    </Group>
  );
}

export { SplitButton };
export type { SplitButtonAction, SplitButtonProps };
