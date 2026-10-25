import {
  CaretDownIcon,
  CaretUpDownIcon,
  SidebarSimpleIcon,
} from "@phosphor-icons/react";
import type * as React from "react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { shellSidebarClasses as c } from "@/components/event/shell/sidebar-classes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/components/utils/cn";

/*
  The S2S sidebar is components/ui/sidebar, restyled. EventShell mounts the SidebarProvider
  (232px / 56px, auto-collapse at ≤1360px); these wrappers are the primitive's parts with the
  S2S classes applied, so an existing sidebar switches over by swapping imports:
    Sidebar → ShellSidebar, SidebarHeader → ShellSidebarHeader, SidebarContent →
    ShellSidebarContent, SidebarGroup → ShellSidebarGroup, SidebarGroupLabel →
    ShellSidebarGroupLabel, SidebarMenu → ShellSidebarMenu, SidebarMenuButton →
    ShellSidebarMenuButton, SidebarMenuBadge → ShellSidebarMenuBadge, SidebarFooter →
    ShellSidebarFooter. SidebarMenuItem is used as is.
*/

/** `<Sidebar collapsible="icon">` with the S2S look. Hidden at 800px and under (use `PhoneDock`). */
function ShellSidebar({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Sidebar>, "collapsible">) {
  return (
    <Sidebar
      collapsible="icon"
      className={cn(c.sidebar, className)}
      {...props}
    />
  );
}

/** The top row: pass the brand (`ShellSidebarBrand`, or a MenuTrigger rendering it); the collapse toggle follows. */
function ShellSidebarHeader({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SidebarHeader>) {
  return (
    <SidebarHeader className={cn(c.header, className)} {...props}>
      {children}
      <ShellSidebarToggle />
    </SidebarHeader>
  );
}

/** The collapse toggle: an S2S ghost icon button calling `useSidebar().toggleSidebar`. */
function ShellSidebarToggle({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children">) {
  const { open, toggleSidebar } = useSidebar();
  return (
    <Button
      iconOnly
      variant="ghost"
      label={open ? "Collapse sidebar" : "Expand sidebar"}
      aria-expanded={open}
      className={cn("shrink-0", className)}
      onClick={toggleSidebar}
      {...props}
    >
      <Icon icon={SidebarSimpleIcon} size="md" />
    </Button>
  );
}

type ShellSidebarBrandProps = Omit<
  React.ComponentProps<"button">,
  "children"
> & {
  /** The 24px mark: initials or a logo `<img>`. */
  mark: React.ReactNode;
  /** The event (or org) name; truncates. */
  name: React.ReactNode;
  /** The up/down caret, when this opens the event switcher. Default true. */
  caret?: boolean;
};

/**
 * The brand / event-switcher button (hidden when collapsed). Use it as a Base UI trigger's
 * `render`: `<MenuTrigger render={<ShellSidebarBrand mark="SO" name="Spring Open" />} />`.
 * Also pass it to `EventShell`'s `phoneBrand` for the phone brand row.
 */
function ShellSidebarBrand({
  mark,
  name,
  caret = true,
  className,
  ...props
}: ShellSidebarBrandProps) {
  return (
    <button
      type="button"
      className={cn(
        "s2s-brand s2s-focus group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    >
      <span className="s2s-brand-mark">{mark}</span>
      <span className="s2s-brand-name">{name}</span>
      {caret && <Icon icon={CaretUpDownIcon} className="text-fg-3" />}
    </button>
  );
}

function ShellSidebarContent({
  className,
  ...props
}: React.ComponentProps<typeof SidebarContent>) {
  return <SidebarContent className={cn(c.content, className)} {...props} />;
}

function ShellSidebarGroup({
  className,
  ...props
}: React.ComponentProps<typeof SidebarGroup>) {
  return <SidebarGroup className={cn(c.group, className)} {...props} />;
}

/** A section label ("Rosters") with its caret; a 1px rule when collapsed. */
function ShellSidebarGroupLabel({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SidebarGroupLabel>) {
  return (
    <SidebarGroupLabel className={cn(c.groupLabel, className)} {...props}>
      {children}
      <Icon icon={CaretDownIcon} />
    </SidebarGroupLabel>
  );
}

function ShellSidebarMenu({
  className,
  ...props
}: React.ComponentProps<typeof SidebarMenu>) {
  return <SidebarMenu className={cn(c.menu, className)} {...props} />;
}

/**
 * A nav item: `<ShellSidebarMenuButton isActive render={<Link to=… />} tooltip="Dancers">
 * <Icon icon={UsersIcon} size="md" /><span>Dancers</span></ShellSidebarMenuButton>`.
 * Keep the label in a <span>; `tooltip` shows it when collapsed.
 */
function ShellSidebarMenuButton({
  className,
  ...props
}: React.ComponentProps<typeof SidebarMenuButton>) {
  return (
    <SidebarMenuButton className={cn(c.menuButton, className)} {...props} />
  );
}

/** A roster count, placed after the button inside the same SidebarMenuItem. */
function ShellSidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<typeof SidebarMenuBadge>) {
  return <SidebarMenuBadge className={cn(c.menuBadge, className)} {...props} />;
}

function ShellSidebarFooter({
  className,
  ...props
}: React.ComponentProps<typeof SidebarFooter>) {
  return <SidebarFooter className={cn(c.footer, className)} {...props} />;
}

type ShellSidebarUserProps = Omit<
  React.ComponentProps<typeof SidebarMenuButton>,
  "children" | "size"
> & {
  /** Avatar initials. */
  initials: string;
  name: React.ReactNode;
  email?: React.ReactNode;
};

/**
 * The signed-in person at the foot (wraps its own SidebarMenu/Item). Pass
 * `render={<MenuTrigger />}` to open the "View as" menu. Collapsed, only the avatar shows.
 */
function ShellSidebarUser({
  initials,
  name,
  email,
  className,
  ...props
}: ShellSidebarUserProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className={cn(c.userButton, className)}
          {...props}
        >
          <span className="s2s-avatar" aria-hidden="true">
            {initials}
          </span>
          <span className="s2s-side-foot-text">
            <span className="s2s-side-foot-name">{name}</span>
            {email !== undefined && (
              <span className="s2s-side-foot-email">{email}</span>
            )}
          </span>
          <Icon icon={CaretUpDownIcon} className="text-fg-3" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export {
  ShellSidebar,
  ShellSidebarBrand,
  ShellSidebarContent,
  ShellSidebarFooter,
  ShellSidebarGroup,
  ShellSidebarGroupLabel,
  ShellSidebarHeader,
  ShellSidebarMenu,
  ShellSidebarMenuBadge,
  ShellSidebarMenuButton,
  SidebarMenuItem as ShellSidebarMenuItem,
  ShellSidebarToggle,
  ShellSidebarUser,
};
export type { ShellSidebarBrandProps, ShellSidebarUserProps };
