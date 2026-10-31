/**
 * Class recipes that restyle the components/ui/sidebar parts into the S2S sidebar. The
 * Shell* wrappers in shell-sidebar.tsx apply them; an existing sidebar can also pass them as
 * `className` on the components/ui parts directly. They rely on tailwind-merge (via `cn` in
 * the primitives) to replace the primitive's own sizes and colours.
 */
export const shellSidebarClasses = {
  /** `<Sidebar collapsible="icon">` container: 8px padding, no border. */
  sidebar: "p-2 group-data-[side=left]:border-r-0",
  /** SidebarHeader: brand + collapse toggle on one 40px row. */
  header:
    "h-10 flex-row items-center gap-1 p-0 group-data-[collapsible=icon]:justify-center",
  content: "mt-2 gap-0.5",
  group: "gap-0.5 p-0",
  /** Section label ("Rosters", "Admin"): fg-3 12px; a 1px rule when collapsed. */
  groupLabel:
    "mt-2.5 h-7 gap-1.5 rounded-none px-2.5 text-[12px] font-medium text-fg-3 " +
    "group-data-[collapsible=icon]:mx-2.5 group-data-[collapsible=icon]:my-2 group-data-[collapsible=icon]:h-px " +
    "group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-line group-data-[collapsible=icon]:text-[0px] " +
    "group-data-[collapsible=icon]:opacity-100 group-data-[collapsible=icon]:[&>svg]:hidden",
  menu: "gap-0.5",
  /**
   * SidebarMenuButton for a nav item: 32px, fg-2, surface-active when `isActive`. Put the
   * label in a <span> after the icon; collapsed, the button is a 36px icon square.
   */
  menuButton:
    "h-8 gap-2.5 rounded-(--radius-6) px-2.5 py-0 text-[13.5px] font-medium text-fg-2 " +
    "hover:bg-surface-hover hover:text-fg active:bg-surface-active active:text-fg " +
    "data-[active=true]:bg-surface-active data-[active=true]:font-medium data-[active=true]:text-fg " +
    "focus-visible:ring-0 s2s-focus group-has-data-[sidebar=menu-badge]/menu-item:pe-12 " +
    "group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:justify-center " +
    "group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:[&>span]:hidden",
  /** SidebarMenuBadge for a roster count: mono 11.5px in `count`, at the right. */
  menuBadge:
    "right-2.5 justify-end px-0 font-mono text-[11.5px] font-normal text-count " +
    "peer-hover/menu-button:text-count peer-data-[active=true]/menu-button:text-count",
  footer: "p-0",
  /** SidebarMenuButton size="lg" for the signed-in person (avatar, name, email). */
  userButton:
    "h-12 gap-2.5 rounded-(--radius-8) px-2 py-0 text-fg hover:bg-surface-hover hover:text-fg " +
    "active:bg-surface-hover active:text-fg data-popup-open:bg-surface-hover focus-visible:ring-0 s2s-focus " +
    "group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! " +
    "group-data-[collapsible=icon]:[&>:not(:first-child)]:hidden",
} as const;
